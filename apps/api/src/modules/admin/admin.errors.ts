import { assertNever, DomainError } from "../../shared/errors";

export const AdminErrorCodes = {
    UserNotFound: "ADMIN_USER_NOT_FOUND",
    RideNotFound: "ADMIN_RIDE_NOT_FOUND",
    RideAlreadyCancelled: "ADMIN_RIDE_ALREADY_CANCELLED",
    ReviewNotFound: "ADMIN_REVIEW_NOT_FOUND",
    ReportNotFound: "ADMIN_REPORT_NOT_FOUND",
    ReportReasonRequired: "ADMIN_REPORT_REASON_REQUIRED",
    ReportInvalidTransition: "ADMIN_REPORT_INVALID_TRANSITION",
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
        case AdminErrorCodes.ReportNotFound:
            return 404;
        case AdminErrorCodes.RideAlreadyCancelled:
        case AdminErrorCodes.ReportReasonRequired:
            return 400;
        case AdminErrorCodes.ReportInvalidTransition:
            return 409;
        default:
            return assertNever(code);
    }
}
