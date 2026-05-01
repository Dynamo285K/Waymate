export type AuthClientError = {
    status?: number;
    message?: string;
    code?: string;
};

/**
 * Resolves an i18n key for a better-auth client error.
 *
 * Better-auth surfaces errors through its own client SDK with a
 * `{ status, message, code? }` shape, distinct from our backend's
 * `ApiError { error: string }` (handled separately by `lib/api-errors.ts`).
 *
 * Resolution order:
 *  1. Specific message-substring matches for config failures the user can't
 *     act on ("Invalid origin", "Invalid callback URL") → friendly copy.
 *  2. Status-code buckets (400/404 → "google not configured", 401, 5xx).
 *  3. `fallback` (default `errors.unknown`).
 *
 * Always log the original error alongside the mapping so the raw message is
 * available in DevTools for debugging.
 */
export function getAuthErrorI18nKey(
    error: AuthClientError,
    fallback = "errors.unknown"
): string {
    const message = (error.message ?? "").toLowerCase();
    if (
        message.includes("invalid origin") ||
        message.includes("invalid callback")
    ) {
        return "auth.googleUnavailable";
    }

    if (error.status === 400 || error.status === 404) {
        return "auth.googleNotConfigured";
    }

    if (error.status === 401) return "errors.unauthorized";
    if (error.status && error.status >= 500) return "errors.server";

    return fallback;
}
