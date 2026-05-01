import { assertNever, DomainError } from "../../shared/errors";

export const AdminErrorCodes = {
    UserNotFound: "ADMIN_USER_NOT_FOUND",
    CannotDemoteSelf: "ADMIN_CANNOT_DEMOTE_SELF",
    CannotChangeOwnStatus: "ADMIN_CANNOT_CHANGE_OWN_STATUS",
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
        case AdminErrorCodes.CannotDemoteSelf:
        case AdminErrorCodes.CannotChangeOwnStatus:
            return 409;
        default:
            return assertNever(code);
    }
}
