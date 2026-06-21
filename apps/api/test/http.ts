import { app } from "../src/index";

const API_ORIGIN = "http://localhost";

export function apiRequest(
    path: string,
    init?: RequestInit
): Promise<Response> {
    return app.handle(new Request(new URL(path, API_ORIGIN), init));
}

/** Helper to quickly construct a JSON POST request body and headers. */
export function jsonRequest(data: unknown, method = "POST"): RequestInit {
    return {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(data),
    };
}
