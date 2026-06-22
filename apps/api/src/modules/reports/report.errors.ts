import { assertNever, DomainError } from "../../shared/errors";

export const ReportErrorCodes = {
    SelfReportNotAllowed: "REPORT_CANNOT_REPORT_SELF",
    TargetNotAllowed: "REPORT_TARGET_NOT_ALLOWED",
    TargetUserNotFound: "REPORT_TARGET_USER_NOT_FOUND",
    RideNotFound: "REPORT_RIDE_NOT_FOUND",
    DuplicateOpenReport: "REPORT_DUPLICATE_OPEN",
    ReportNotFound: "REPORT_NOT_FOUND",
    ReportReasonRequired: "REPORT_REASON_REQUIRED",
    ReportInvalidTransition: "REPORT_INVALID_TRANSITION",
} as const;

export type ReportErrorCode =
    (typeof ReportErrorCodes)[keyof typeof ReportErrorCodes];

export class ReportError extends DomainError {
    readonly code: ReportErrorCode;
    constructor(code: ReportErrorCode) {
        super(code);
        this.code = code;
    }
}

export function reportErrorToHttpStatus(code: ReportErrorCode): number {
    switch (code) {
        case ReportErrorCodes.TargetUserNotFound:
        case ReportErrorCodes.RideNotFound:
        case ReportErrorCodes.ReportNotFound:
            return 404;
        case ReportErrorCodes.TargetNotAllowed:
            return 403;
        case ReportErrorCodes.SelfReportNotAllowed:
        case ReportErrorCodes.ReportReasonRequired:
            return 400;
        case ReportErrorCodes.DuplicateOpenReport:
        case ReportErrorCodes.ReportInvalidTransition:
            return 409;
        default:
            return assertNever(code);
    }
}
