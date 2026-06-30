import { DomainError } from "../../shared/errors";

export const AuthErrorCodes = {
    Unauthorized: "UNAUTHORIZED",
    Forbidden: "FORBIDDEN",
    OnboardingRequired: "ONBOARDING_REQUIRED",
    UserBanned: "USER_BANNED",
    UserSuspended: "USER_SUSPENDED",
} as const;

export type AuthErrorCode =
    (typeof AuthErrorCodes)[keyof typeof AuthErrorCodes];

const AUTH_ERROR_STATUS: Record<AuthErrorCode, number> = {
    [AuthErrorCodes.Unauthorized]: 401,
    [AuthErrorCodes.Forbidden]: 403,
    [AuthErrorCodes.OnboardingRequired]: 403,
    [AuthErrorCodes.UserBanned]: 403,
    [AuthErrorCodes.UserSuspended]: 403,
};

export class AuthError extends DomainError {
    readonly code: AuthErrorCode;
    constructor(code: AuthErrorCode) {
        super(code, AUTH_ERROR_STATUS[code]);
        this.code = code;
    }
}
