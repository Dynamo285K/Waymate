import { DomainError } from "../../shared/errors";

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

const REPORT_ERROR_STATUS: Record<ReportErrorCode, number> = {
    [ReportErrorCodes.TargetUserNotFound]: 404,
    [ReportErrorCodes.RideNotFound]: 404,
    [ReportErrorCodes.ReportNotFound]: 404,
    [ReportErrorCodes.TargetNotAllowed]: 403,
    [ReportErrorCodes.SelfReportNotAllowed]: 400,
    [ReportErrorCodes.ReportReasonRequired]: 400,
    [ReportErrorCodes.DuplicateOpenReport]: 409,
    [ReportErrorCodes.ReportInvalidTransition]: 409,
};

export class ReportError extends DomainError {
    readonly code: ReportErrorCode;
    constructor(code: ReportErrorCode) {
        super(code, REPORT_ERROR_STATUS[code]);
        this.code = code;
    }
}
