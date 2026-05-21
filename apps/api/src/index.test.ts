import { describe, it, expect } from "vitest";
import { apiRequest } from "../test/http";
import { env } from "./config/env";

// Exercises the two cross-cutting checks in the root `.onRequest` hook
// (body-size limit + rate limiting). The rate-limit *algorithm* is unit-tested
// in shared/rate-limit.test.ts; this asserts it is actually wired into the HTTP
// pipeline and produces the documented 413 / 429 responses.
describe("Request hardening", () => {
    it("rejects a request whose Content-Length exceeds the limit with 413", async () => {
        // The body-size guard reads the Content-Length header in `.onRequest`,
        // before routing — the target path only has to be a non-GET route.
        // A real reverse proxy always sets this header; here we set it
        // explicitly since a synthetic Request does not derive it from a body.
        const response = await apiRequest("/rides", {
            method: "POST",
            headers: {
                "content-type": "application/json",
                "content-length": String(env.MAX_REQUEST_BODY_BYTES + 1),
            },
            body: "{}",
        });

        expect(response.status).toBe(413);
        await expect(response.json()).resolves.toEqual({
            error: "PAYLOAD_TOO_LARGE",
        });
    });

    it("rate-limits a route past its per-route cap with 429 and a Retry-After header", async () => {
        // POST /rides has a per-route cap of 10/min. The rate-limit check runs
        // in `.onRequest` ahead of auth, so unauthenticated requests still
        // consume tokens: the first 10 reach the auth layer (401), the 11th
        // trips the limiter. A dedicated TEST-NET-3 IP keys an isolated bucket
        // so this flood cannot spill into other tests sharing the process-wide
        // limiter.
        const headers = {
            "content-type": "application/json",
            "x-forwarded-for": "203.0.113.7",
        };

        for (let i = 0; i < 10; i++) {
            const response = await apiRequest("/rides", {
                method: "POST",
                headers,
                body: "{}",
            });
            expect(response.status).not.toBe(429);
        }

        const limited = await apiRequest("/rides", {
            method: "POST",
            headers,
            body: "{}",
        });

        expect(limited.status).toBe(429);
        expect(Number(limited.headers.get("retry-after"))).toBeGreaterThan(0);
        await expect(limited.json()).resolves.toEqual({
            error: "RATE_LIMITED",
        });
    });
});
