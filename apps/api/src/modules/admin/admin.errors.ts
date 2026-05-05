import { assertNever, DomainError } from "../../shared/errors";

export const AdminErrorCodes = {
    UserNotFound: "ADMIN_USER_NOT_FOUND",
} as const;

export type AdminErrorCode =
    (typeof AdminErrorCodes)[keyof typeof AdminErrorCodes];

export class AdminError extends DomainError {
    readonly code: AdminErrorCode;
    constructor(code: AdminErrorCode) {
        super(code);
        this.code = code;
    }
}

export function adminErrorToHttpStatus(code: AdminErrorCode): number {
    switch (code) {
        case AdminErrorCodes.UserNotFound:
            return 404;
        default:
            return assertNever(code);
    }
}
