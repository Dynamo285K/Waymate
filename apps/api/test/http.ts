import { app } from "../src/index";
import { env } from "../src/config/env";

const API_ORIGIN = "http://localhost";

export function apiRequest(
    path: string,
    init?: RequestInit
): Promise<Response> {
    const headers = new Headers(init?.headers);
    // Inject a unique pseudo-IP to prevent parallel tests from clashing in the
    // same rate-limit bucket (since `getClientIp` falls back to "unknown").
    if (!headers.has("x-forwarded-for")) {
        // Pad the UUID with enough dummy proxies so that `getClientIp`'s
        // `hops[hops.length - env.TRUSTED_PROXY_COUNT]` logic reads the UUID.
        const proxies = Array.from({ length: env.TRUSTED_PROXY_COUNT }).map(() => "127.0.0.1");
        headers.set("x-forwarded-for", [crypto.randomUUID(), ...proxies].join(", "));
    }

    return app.handle(
        new Request(new URL(path, API_ORIGIN), { ...init, headers })
    );
}

/** Helper to quickly construct a JSON POST request body and headers. */
export function jsonRequest(data: unknown, method = "POST"): RequestInit {
    return {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(data),
    };
}
