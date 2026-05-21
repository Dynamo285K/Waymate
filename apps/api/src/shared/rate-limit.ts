import { RateLimitError } from "./request-errors";

/**
 * In-memory fixed-window rate limiter.
 *
 * Replaces the previous Postgres-backed limiter, which did 1–2 writes per
 * request on the hot path and grew the `rate_limits` table without bound. This
 * keeps counters in process memory: on a single instance the limit is exact;
 * across replicas it is approximate (each instance holds its own window) and
 * everything resets on restart. Back it with Redis if a strict shared limit is
 * ever required. better-auth keeps its own DB-backed limiting for `/api/auth/*`
 * (see auth.ts) — this only covers our application routes.
 *
 * Semantics differ slightly from the old version: a window resets `windowMs`
 * after it opened, regardless of activity, rather than extending the cool-down
 * on every rejected attempt. This is the conventional fixed-window behaviour.
 */
type Window = { count: number; resetAt: number };

const windows = new Map<string, Window>();

// Distinct keys (e.g. one per client IP) would otherwise accumulate forever.
// Sweep expired entries lazily — at most once per window — so there are no
// timers keeping the process alive (matters for tests and graceful shutdown).
let lastSweepAt = 0;

function sweepExpired(now: number, windowMs: number): void {
    if (now - lastSweepAt < windowMs) return;
    lastSweepAt = now;
    for (const [key, window] of windows) {
        if (now >= window.resetAt) windows.delete(key);
    }
}

export function checkRateLimit(
    key: string,
    max: number,
    windowMs: number
): void {
    const now = Date.now();
    sweepExpired(now, windowMs);

    const existing = windows.get(key);
    if (!existing || now >= existing.resetAt) {
        windows.set(key, { count: 1, resetAt: now + windowMs });
        return;
    }

    existing.count += 1;
    if (existing.count > max) {
        const retryAfterSeconds = Math.max(
            1,
            Math.ceil((existing.resetAt - now) / 1000)
        );
        throw new RateLimitError(retryAfterSeconds);
    }
}
