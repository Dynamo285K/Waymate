export type AuthClientError = {
    status?: number;
    message?: string;
    code?: string;
};

/**
 * Resolves an i18n key for a Google sign-in failure surfaced by the
 * better-auth client.
 *
 *  - "Invalid origin" / "Invalid callback URL" — origin not in
 *    `trustedOrigins` → friendly "unavailable" copy.
 *  - 400 / 404 — backend has no Google credentials configured at all.
 *  - 5xx / unknown — generic fallback.
 *
 * Always log the original error alongside the mapping so the raw message is
 * available in DevTools for debugging.
 */
export function getGoogleAuthErrorI18nKey(
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

    if (error.status && error.status >= 500) return "errors.server";

    return fallback;
}

/**
 * Resolves an i18n key for an email sign-in / sign-up failure surfaced by the
 * better-auth client. Unlike the Google helper, 400/401 here mean "wrong
 * credentials", not a config problem.
 */
export function getEmailAuthErrorI18nKey(
    error: AuthClientError,
    fallback: string
): string {
    const code = (error.code ?? "").toUpperCase();
    const message = (error.message ?? "").toUpperCase();

    if (code === "USER_BANNED" || message.includes("USER_BANNED")) {
        return "login.banned";
    }

    if (code === "USER_SUSPENDED" || message.includes("USER_SUSPENDED")) {
        return "login.suspended";
    }

    if (error.status && error.status >= 500) return "errors.server";
    return fallback;
}
