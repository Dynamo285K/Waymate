import { app } from "../src/index";

const API_ORIGIN = "http://localhost";

export function apiRequest(
    path: string,
    init?: RequestInit
): Promise<Response> {
    const headers = new Headers(init?.headers);
    // Inject a unique pseudo-IP to prevent parallel tests from clashing in the
    // same rate-limit bucket (since `getClientIp` falls back to "unknown").
    if (!headers.has("x-forwarded-for")) {
        // Appending '127.0.0.1' so the TRUSTED_PROXY_COUNT logic parses it
        // cleanly, prefixed by a UUID to ensure test isolation.
        headers.set("x-forwarded-for", `${crypto.randomUUID()}, 127.0.0.1`);
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
