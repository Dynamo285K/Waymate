import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { db } from "../db";
import { rateLimits } from "../db/schema";
import { RateLimitError } from "./request-errors";

/**
 * Atomic rate-limit check against the shared `rate_limits` table.
 *
 * One round-trip per call: an `INSERT ... ON CONFLICT UPDATE` that either
 * inserts a new row (count=1, last_request=now), resets the window if the
 * stored `last_request` is older than `windowMs` (count=1), or increments
 * the existing counter. Throws `RateLimitError` once the post-update count
 * exceeds `max`. Every rejected attempt still updates `last_request`, so
 * abuse extends the cool-down — callers stop being throttled only after
 * `windowMs` of silence.
 */
export async function checkRateLimit(
    key: string,
    max: number,
    windowMs: number
): Promise<void> {
    const now = Date.now();

    const rows = await db
        .insert(rateLimits)
        .values({
            id: randomUUID(),
            key,
            count: 1,
            lastRequest: now,
        })
        .onConflictDoUpdate({
            target: rateLimits.key,
            set: {
                count: sql`CASE
                    WHEN ${now} - ${rateLimits.lastRequest} > ${windowMs} THEN 1
                    ELSE ${rateLimits.count} + 1
                END`,
                lastRequest: now,
            },
        })
        .returning({
            count: rateLimits.count,
            lastRequest: rateLimits.lastRequest,
        });

    const row = rows[0];
    if (!row) return;

    if (row.count > max) {
        const retryAfterMs = row.lastRequest + windowMs - Date.now();
        const retryAfterSeconds = Math.max(1, Math.ceil(retryAfterMs / 1000));
        throw new RateLimitError(retryAfterSeconds);
    }
}
