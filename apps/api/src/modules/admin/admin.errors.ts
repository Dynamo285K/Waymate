import { assertNever, DomainError } from "../../shared/errors";

export const AdminErrorCodes = {
    UserNotFound: "ADMIN_USER_NOT_FOUND",
    RideNotFound: "ADMIN_RIDE_NOT_FOUND",
    RideAlreadyCancelled: "ADMIN_RIDE_ALREADY_CANCELLED",
    ReviewNotFound: "ADMIN_REVIEW_NOT_FOUND",
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
        case AdminErrorCodes.RideNotFound:
        case AdminErrorCodes.ReviewNotFound:
            return 404;
        case AdminErrorCodes.RideAlreadyCancelled:
            return 400;
        default:
            return assertNever(code);
    }
}
