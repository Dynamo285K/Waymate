export const REPORT_TARGET_USER_NOT_FOUND_CODE = "REPORT_TARGET_USER_NOT_FOUND";
export const REPORT_TARGET_NOT_ALLOWED_CODE = "REPORT_TARGET_NOT_ALLOWED";
export const REPORT_CANNOT_REPORT_SELF_CODE = "REPORT_CANNOT_REPORT_SELF";
export const REPORT_RIDE_NOT_FOUND_CODE = "REPORT_RIDE_NOT_FOUND";

export const reportUserErrorMap: Record<string, string> = {
    [REPORT_TARGET_USER_NOT_FOUND_CODE]: "report.errors.targetNotFound",
    [REPORT_TARGET_NOT_ALLOWED_CODE]: "report.errors.targetNotAllowed",
    [REPORT_CANNOT_REPORT_SELF_CODE]: "report.errors.selfReport",
    [REPORT_RIDE_NOT_FOUND_CODE]: "report.errors.rideNotFound",
};
