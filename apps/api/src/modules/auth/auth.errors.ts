import { assertNever, DomainError } from "../../shared/errors";

export const AuthErrorCodes = {
    Unauthorized: "UNAUTHORIZED",
    Forbidden: "FORBIDDEN",
    OnboardingRequired: "ONBOARDING_REQUIRED",
} as const;

export type AuthErrorCode =
    (typeof AuthErrorCodes)[keyof typeof AuthErrorCodes];

export class AuthError extends DomainError {
    readonly code: AuthErrorCode;
    constructor(code: AuthErrorCode) {
        super(code);
        this.code = code;
    }
}

export function authErrorToHttpStatus(code: AuthErrorCode): number {
    switch (code) {
        case AuthErrorCodes.Unauthorized:
            return 401;
        case AuthErrorCodes.Forbidden:
        case AuthErrorCodes.OnboardingRequired:
            return 403;
        default:
            return assertNever(code);
    }
}

// Shape of the context Elysia hands to `.onError`. Typed loosely on purpose
// so the helper stays decoupled from Elysia's internal generics — the only
// values we read are documented here.
type RouteErrorContext = {
    code: string | number;
    status: (code: number, body: { error: string }) => unknown;
    error: unknown;
};

/**
 * Builds the standard `.onError` callback every route module uses. Catches
 * the module's own domain error first, then `AuthError` (so guard failures
 * surface as 401/403), then validation, then a 500 catch-all. Centralising
 * the chain means the response shape and the catch order live in one place.
 */
export function createErrorHandler<E extends DomainError>(
    DomainErrorClass: new (...args: never[]) => E,
    toHttpStatus: (code: E["code"]) => number
) {
    return (ctx: RouteErrorContext) => {
        const { code, status, error } = ctx;
        if (error instanceof DomainErrorClass) {
            return status(toHttpStatus(error.code as E["code"]), {
                error: error.code,
            });
        }
        if (error instanceof AuthError) {
            return status(authErrorToHttpStatus(error.code), {
                error: error.code,
            });
        }
        if (code === "VALIDATION" || code === "PARSE") {
            return status(400, { error: "VALIDATION" });
        }
        if (code === "INTERNAL_SERVER_ERROR" || code === "UNKNOWN") {
            return status(500, { error: "INTERNAL_SERVER_ERROR" });
        }
    };
}
