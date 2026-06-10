export const ADMIN_REPORT_NOT_FOUND_CODE = "ADMIN_REPORT_NOT_FOUND";
export const ADMIN_REPORT_REASON_REQUIRED_CODE = "ADMIN_REPORT_REASON_REQUIRED";
export const ADMIN_REPORT_INVALID_TRANSITION_CODE =
    "ADMIN_REPORT_INVALID_TRANSITION";

export const adminReportsErrorMap: Record<string, string> = {
    [ADMIN_REPORT_NOT_FOUND_CODE]: "admin.errors.reportNotFound",
    [ADMIN_REPORT_REASON_REQUIRED_CODE]: "admin.errors.reportReasonRequired",
    [ADMIN_REPORT_INVALID_TRANSITION_CODE]:
        "admin.errors.reportInvalidTransition",
};
