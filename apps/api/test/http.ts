import { app } from "../src/index";

const API_ORIGIN = "http://localhost";

export function apiRequest(
    path: string,
    init?: RequestInit
): Promise<Response> {
    return app.handle(new Request(new URL(path, API_ORIGIN), init));
}
