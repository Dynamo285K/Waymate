import { ApiError, NetworkError } from "./api-fetcher";

/**
 * Pulls the stable BE error code (e.g. `"ADMIN_CANNOT_DEMOTE_SELF"`) out of a
 * thrown {@link ApiError}.
 *
 * Returns `null` for anything that isn't an `ApiError` (e.g. {@link NetworkError},
 * parse errors, …) or for `ApiError`s whose body doesn't follow the standard
 * `{ error: string }` shape.
 */
export function getErrorCode(error: unknown): string | null {
    if (!(error instanceof ApiError)) return null;
    if (
        error.data &&
        typeof error.data === "object" &&
        "error" in error.data &&
        typeof (error.data as { error: unknown }).error === "string"
    ) {
        return (error.data as { error: string }).error;
    }
    return null;
}

/**
 * Resolves an i18n key for the given thrown error.
 *
 * Resolution order:
 *  1. If the error is an `ApiError` whose body's `error` code is present in
 *     `codeMap`, return the mapped key (page-specific copy).
 *  2. If the error is an `ApiError`, fall back to a generic key based on HTTP
 *     status (`401` → `errors.unauthorized`, `403` → `errors.forbidden`,
 *     `404` → `errors.notFound`, `5xx` → `errors.server`, `400` →
 *     `errors.validation`).
 *  3. If the error is a `NetworkError` (offline, AbortError, DNS, …) →
 *     `errors.network`.
 *  4. Final fallback → `fallback` (default `errors.unknown`).
 *
 * @example
 * const adminMap = {
 *     ADMIN_CANNOT_DEMOTE_SELF: "admin.errors.cannotDemoteSelf",
 * };
 * <p>{t(getErrorI18nKey(mutation.error, adminMap))}</p>
 */
export function getErrorI18nKey(
    error: unknown,
    codeMap: Record<string, string>,
    fallback = "errors.unknown"
): string {
    const code = getErrorCode(error);
    if (code && codeMap[code]) return codeMap[code];

    if (error instanceof ApiError) {
        if (error.status === 401) return "errors.unauthorized";
        if (error.status === 403) return "errors.forbidden";
        if (error.status === 404) return "errors.notFound";
        if (error.status === 400) return "errors.validation";
        if (error.status >= 500) return "errors.server";
    }

    if (error instanceof NetworkError) return "errors.network";

    return fallback;
}
