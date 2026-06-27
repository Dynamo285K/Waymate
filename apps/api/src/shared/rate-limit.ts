import Redis from "ioredis";
import { env } from "../config/env";
import { RateLimitError } from "./request-errors";
import { logger } from "./logger";

const redis = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 1, // Fail fast if Redis is down
});

redis.on("error", (err) => {
    // Only log if not in tests to avoid test log spam when Redis is stopped
    if (env.NODE_ENV !== "test") {
        logger.error({ err }, "Redis connection error");
    }
});

// We register a Lua script for an atomic Token Bucket check.
// ARGV[1]: maxTokens (burst limit)
// ARGV[2]: windowMs (refill interval in milliseconds)
// ARGV[3]: now (current timestamp in milliseconds)
// Returns: [1, remaining_tokens] if allowed, [0, 0] if rejected.
redis.defineCommand("consumeToken", {
    numberOfKeys: 1,
    lua: `
local key = KEYS[1]
local max_tokens = tonumber(ARGV[1])
local window_ms = tonumber(ARGV[2])
local now = tonumber(ARGV[3])

local bucket = redis.call('HMGET', key, 'tokens', 'last_refill')
local tokens = tonumber(bucket[1])
local last_refill = tonumber(bucket[2])

if not tokens then
    tokens = max_tokens
    last_refill = now
else
    local elapsed = now - last_refill
    local tokens_to_add = math.floor((elapsed / window_ms) * max_tokens)
    if tokens_to_add > 0 then
        tokens = math.min(tokens + tokens_to_add, max_tokens)
        last_refill = now
    end
end

if tokens > 0 then
    tokens = tokens - 1
    redis.call('HMSET', key, 'tokens', tokens, 'last_refill', last_refill)
    -- Expire keys so Redis doesn't grow unbounded. 
    redis.call('PEXPIRE', key, window_ms * 2)
    return { 1, tokens }
else
    return { 0, 0 }
end
    `,
});

// Declare the injected command type on the redis instance
declare module "ioredis" {
    interface Redis {
        consumeToken(
            key: string,
            maxTokens: number,
            windowMs: number,
            now: number
        ): Promise<[number, number]>;
    }
}

export async function checkRateLimit(
    key: string,
    max: number,
    windowMs: number
): Promise<void> {
    try {
        const now = Date.now();
        const [allowed] = await redis.consumeToken(key, max, windowMs, now);

        if (allowed === 0) {
            const timePerTokenMs = windowMs / max;
            const retryAfterSeconds = Math.max(
                1,
                Math.ceil(timePerTokenMs / 1000)
            );
            throw new RateLimitError(retryAfterSeconds);
        }
    } catch (err) {
        if (err instanceof RateLimitError) throw err;

        // If Redis is unreachable, fail open to avoid bringing down the API
        if (env.NODE_ENV !== "test") {
            logger.error({ err }, "Rate limit check failed or Redis is down");
        }
    }
}
