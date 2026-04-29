const API_BASE_URL =
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

export async function apiFetcher<T>(
    url: string,
    options?: RequestInit
): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${url}`, {
        credentials: "include",
        ...options,
    });

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
