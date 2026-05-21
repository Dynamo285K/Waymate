import { useTranslation } from "react-i18next";
import type { ReportStatus } from "../api-client/model/reportStatus";
import type { ReportType } from "../api-client/model/reportType";

export const REPORT_STATUS_BADGE_CLASSES: Record<ReportStatus, string> = {
    OPEN: "border border-(--color-warning-border) bg-(--color-warning-bg) text-(--color-warning-text)",
    INVESTIGATING:
        "border border-(--color-primary) bg-(--color-primary)/10 text-(--color-primary)",
    RESOLVED:
        "border border-(--color-success-border) bg-(--color-success-bg) text-(--color-success-text)",
    DISMISSED: "bg-(--color-secondary-hover) text-(--color-text-secondary)",
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
