export const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ?? "/api";

export class ApiError<TData = unknown> extends Error {
    readonly status: number;
    readonly data: TData;
    readonly response: Response;

    constructor(status: number, data: TData, response: Response) {
        super(
            data && typeof data === "object" && "error" in data
                ? String((data as { error: unknown }).error)
                : `Request failed with status ${status}`
        );
        this.name = "ApiError";
        this.status = status;
        this.data = data;
        this.response = response;
    }
}

/**
 * Standard error type for every TanStack mutation/query that goes through
 * `apiFetcher`. The runtime is always one of `ApiError<ErrorResponse>` (API
 * returned a non-2xx response with the standard error envelope) or
 * `NetworkError` (request never reached the API). Use this for the `TError`
 * generic on `useMutation` / Orval-generated hooks so consumers see the real
 * runtime types instead of Orval's narrower default.
 */
export type ApiMutationError =
    | ApiError<{ error: string }>
    | NetworkError;

/**
 * Thrown when the request never reaches the API (offline, DNS failure, CORS,
 * AbortError, etc.). Distinct from `ApiError`, which represents a non-2xx
 * response — i.e. the API was reached but rejected the call. Consumers can
 * branch via `instanceof NetworkError` instead of relying on `TypeError`,
 * which is fragile across runtimes (e.g. Bun vs. browsers vs. node-undici).
 */
export class NetworkError extends Error {
    readonly cause: unknown;

    constructor(cause: unknown) {
        super(
            cause instanceof Error
                ? `Network request failed: ${cause.message}`
                : "Network request failed"
        );
        this.name = "NetworkError";
        this.cause = cause;
    }
}

export async function apiFetcher<T>(
    url: string,
    options?: RequestInit
): Promise<T> {
    let response: Response;
    try {
        response = await fetch(`${API_BASE_URL}${url}`, {
            credentials: "include",
            ...options,
        });
    } catch (cause) {
        throw new NetworkError(cause);
    }

    const isEmpty =
        response.status === 204 ||
        response.status === 205 ||
        response.status === 304;
    const data = isEmpty ? null : await parseBody(response);

    if (!response.ok) {
        throw new ApiError(response.status, data, response);
    }

    return data as T;
}

async function parseBody(response: Response): Promise<unknown> {
    const contentType = response.headers.get("Content-Type") ?? "";
    if (contentType.includes("application/json")) {
        const text = await response.text();
        return text.length === 0 ? null : JSON.parse(text);
    }
    return response.text();
}

export default apiFetcher;
