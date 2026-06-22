import { useTranslation } from "react-i18next";
import type { ReportStatus } from "../../../../api-client/model/reportStatus";
import type { ReportType } from "../../../../api-client/model/reportType";

export const REPORT_STATUS_BADGE_CLASSES: Record<ReportStatus, string> = {
    OPEN: "border border-warning-border bg-warning-bg text-warning-text",
    INVESTIGATING: "border border-primary bg-primary/10 text-primary",
    RESOLVED: "border border-success-border bg-success-bg text-success-text",
    DISMISSED: "bg-secondary-hover text-text-secondary",
};

export function useReportStatusLabels(): Record<ReportStatus, string> {
    const { t } = useTranslation();
    return {
        OPEN: t("admin.reports.statusOpen"),
        INVESTIGATING: t("admin.reports.statusInvestigating"),
        RESOLVED: t("admin.reports.statusResolved"),
        DISMISSED: t("admin.reports.statusDismissed"),
    };
}

export function useReportTypeLabels(): Record<ReportType, string> {
    const { t } = useTranslation();
    return {
        INAPPROPRIATE_BEHAVIOR: t("report.types.inappropriateBehavior"),
        NO_SHOW: t("report.types.noShow"),
        OVERCHARGING: t("report.types.overcharging"),
        LEFT_LUGGAGE: t("report.types.leftLuggage"),
        SAFETY_ISSUE: t("report.types.safetyIssue"),
        OTHER: t("report.types.other"),
    };
}
