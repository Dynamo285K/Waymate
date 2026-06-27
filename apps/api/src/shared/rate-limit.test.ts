import { describe, it, expect, vi, afterEach } from "vitest";
import { checkRateLimit } from "./rate-limit";
import { RateLimitError } from "./request-errors";

// Unique key per test so the module-level window map can't leak state between cases.
const freshKey = () => `test:${crypto.randomUUID()}`;

describe("checkRateLimit (redis token bucket)", () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it("allows up to `max` requests within a window", async () => {
        const key = freshKey();
        for (let i = 0; i < 5; i++) {
            await expect(
                checkRateLimit(key, 5, 60_000)
            ).resolves.toBeUndefined();
        }
    });

    it("throws RateLimitError once `max` is exceeded", async () => {
        const key = freshKey();
        for (let i = 0; i < 3; i++) {
            await checkRateLimit(key, 3, 60_000);
        }
        await expect(checkRateLimit(key, 3, 60_000)).rejects.toThrow(
            RateLimitError
        );
    });

    it("reports a positive Retry-After bounded by the window", async () => {
        const key = freshKey();
        await checkRateLimit(key, 1, 60_000);
        try {
            await checkRateLimit(key, 1, 60_000);
            throw new Error("expected RateLimitError");
        } catch (error) {
            expect(error).toBeInstanceOf(RateLimitError);
            const retry = (error as RateLimitError).retryAfterSeconds;
            expect(retry).toBeGreaterThan(0);
            expect(retry).toBeLessThanOrEqual(60);
        }
    });

    it("resets the counter after the window elapses", async () => {
        vi.useFakeTimers();
        vi.setSystemTime(0);
        const key = freshKey();

        await checkRateLimit(key, 1, 1_000);
        await expect(checkRateLimit(key, 1, 1_000)).rejects.toThrow(
            RateLimitError
        );

        vi.setSystemTime(1_001);
        await expect(checkRateLimit(key, 1, 1_000)).resolves.toBeUndefined();
    });
});
