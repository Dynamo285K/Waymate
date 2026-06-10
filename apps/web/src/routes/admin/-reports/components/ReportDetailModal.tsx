import { useTranslation } from "react-i18next";
import { Avatar, Button, IconButton, Modal } from "@waymate/ui";
import { useGetAdminReportsById } from "../../../../api-client/admin/admin";
import type { ReportStatus } from "../../../../api-client/model/reportStatus";
import { getErrorI18nKey } from "../../../../lib/api-errors";
import { adminReportsErrorMap } from "../lib/admin-report-errors";
import {
    fullName,
    formatDate,
} from "../../../../features/admin/lib/admin-format";
import { useReportTypeLabels } from "../lib/admin-report-labels";
import { ReportStatusBadge } from "./ReportStatusBadge";
import { ReportStatusHistoryEntry } from "./ReportStatusHistoryEntry";

type ReportDetailModalProps = {
    theme: "light" | "dark";
    reportId: string;
    isThisReportMutating: boolean;
    mutationErrorForThisReport: unknown;
    onClose: () => void;
    onRequestStatus: (target: ReportStatus) => void;
};

// Workflow: OPEN can go to INVESTIGATING / RESOLVED / DISMISSED.
// INVESTIGATING can go to RESOLVED / DISMISSED. RESOLVED and DISMISSED
// are terminal — the detail UI hides any action that the backend would
// reject so admins can't waste a click.
const ALLOWED_TRANSITIONS: Record<ReportStatus, ReportStatus[]> = {
    OPEN: ["INVESTIGATING", "RESOLVED", "DISMISSED"],
    INVESTIGATING: ["RESOLVED", "DISMISSED"],
    RESOLVED: [],
    DISMISSED: [],
};

export function ReportDetailModal({
    theme,
    reportId,
    isThisReportMutating,
    mutationErrorForThisReport,
    onClose,
    onRequestStatus,
}: ReportDetailModalProps) {
    const { t } = useTranslation();
    const detailQuery = useGetAdminReportsById(reportId);
    const typeLabels = useReportTypeLabels();

    const labelClass =
        "text-xs font-bold text-(--color-text-secondary) tracking-wider mb-1 block";

    const data = detailQuery.data;
    const reporterName = data
        ? fullName(
              data.report.reporter.firstName,
              data.report.reporter.lastName
          ) || data.report.reporter.email
        : "";
    const targetName = data
        ? fullName(data.report.target.firstName, data.report.target.lastName) ||
          data.report.target.email
        : "";

    const allowed = data ? ALLOWED_TRANSITIONS[data.report.reportStatus] : [];

    return (
        <Modal
            open={true}
            onClose={onClose}
            theme={theme}
        >
            <div className="w-[calc(100vw-2rem)] max-w-2xl p-8 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-(--color-text-primary)">
                        {t("admin.reports.detailTitle")}
                    </h2>
                    <IconButton
                        ariaLabel="Close"
                        icon={<span aria-hidden>✕</span>}
                        variant="ghost"
                        onClick={onClose}
                    />
                </div>

                {detailQuery.isLoading && (
                    <p className="text-(--color-text-secondary)">
                        {t("admin.reports.loading")}
                    </p>
                )}

                {!detailQuery.isLoading && detailQuery.isError && (
                    <p className="text-(--color-danger-text)">
                        {t(
                            getErrorI18nKey(
                                detailQuery.error,
                                adminReportsErrorMap
                            )
                        )}
                    </p>
                )}

                {!detailQuery.isLoading && data && (
                    <>
                        <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
                            <span className="text-sm font-semibold text-(--color-text-primary)">
                                {typeLabels[data.report.reportType]}
                            </span>
                            <ReportStatusBadge
                                status={data.report.reportStatus}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="border border-(--color-border) rounded-xl p-4">
                                <p className={labelClass}>
                                    {t("admin.reports.reporter")}
                                </p>
                                <div className="flex items-center gap-2">
                                    <Avatar
                                        name={reporterName}
                                        size="sm"
                                    />
                                    <div>
                                        <p className="text-sm font-semibold text-(--color-text-primary)">
                                            {reporterName}
                                        </p>
                                        <p className="text-xs text-(--color-text-secondary)">
                                            {data.report.reporter.email}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="border border-(--color-border) rounded-xl p-4">
                                <p className={labelClass}>
                                    {t("admin.reports.target")}
                                </p>
                                <div className="flex items-center gap-2">
                                    <Avatar
                                        name={targetName}
                                        size="sm"
                                    />
                                    <div>
                                        <p className="text-sm font-semibold text-(--color-text-primary)">
                                            {targetName}
                                        </p>
                                        <p className="text-xs text-(--color-text-secondary)">
                                            {data.report.target.email}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {data.report.ride && (
                            <div className="border border-(--color-border) rounded-xl p-4 mb-6">
                                <p className={labelClass}>
                                    {t("admin.rideContext")}
                                </p>
                                <p className="text-sm font-semibold text-(--color-text-primary)">
                                    {data.report.ride.originCity} →{" "}
                                    {data.report.ride.destinationCity}
                                </p>
                                <p className="text-xs text-(--color-text-secondary) mt-1">
                                    {formatDate(
                                        data.report.ride.departureAt,
                                        "—"
                                    )}
                                </p>
                            </div>
                        )}

                        <div className="mb-6">
                            <p className={labelClass}>
                                {t("admin.reports.description")}
                            </p>
                            <p className="text-sm text-(--color-text-primary) whitespace-pre-wrap border border-(--color-border) rounded-xl p-3 bg-(--color-bg)">
                                {data.report.description}
                            </p>
                        </div>

                        {data.report.resolutionReason && (
                            <div className="mb-6">
                                <p className={labelClass}>
                                    {t("admin.reports.resolutionReason")}
                                </p>
                                <p className="text-sm text-(--color-text-primary) whitespace-pre-wrap border border-(--color-border) rounded-xl p-3 bg-(--color-bg)">
                                    {data.report.resolutionReason}
                                </p>
                            </div>
                        )}

                        {mutationErrorForThisReport !== null &&
                            mutationErrorForThisReport !== undefined && (
                                <p className="text-sm text-(--color-danger-text) mb-4">
                                    {t(
                                        getErrorI18nKey(
                                            mutationErrorForThisReport,
                                            adminReportsErrorMap
                                        )
                                    )}
                                </p>
                            )}

                        {allowed.length > 0 && (
                            <div className="flex gap-2 flex-wrap mb-6">
                                {allowed.includes("INVESTIGATING") && (
                                    <Button
                                        variant="secondary"
                                        onClick={() =>
                                            onRequestStatus("INVESTIGATING")
                                        }
                                        disabled={isThisReportMutating}
                                    >
                                        {t("admin.reports.markInvestigating")}
                                    </Button>
                                )}
                                {allowed.includes("RESOLVED") && (
                                    <Button
                                        variant="primary"
                                        onClick={() =>
                                            onRequestStatus("RESOLVED")
                                        }
                                        disabled={isThisReportMutating}
                                    >
                                        {t("admin.reports.markResolved")}
                                    </Button>
                                )}
                                {allowed.includes("DISMISSED") && (
                                    <Button
                                        variant="red"
                                        onClick={() =>
                                            onRequestStatus("DISMISSED")
                                        }
                                        disabled={isThisReportMutating}
                                    >
                                        {t("admin.reports.markDismissed")}
                                    </Button>
                                )}
                            </div>
                        )}

                        <h3 className="text-base font-bold text-(--color-text-primary) mb-3">
                            {t("admin.statusHistory")}
                        </h3>
                        {data.statusHistory.length === 0 ? (
                            <p className="text-sm text-(--color-text-secondary)">
                                {t("admin.noStatusHistory")}
                            </p>
                        ) : (
                            <ul className="flex flex-col gap-2">
                                {data.statusHistory.map((entry) => (
                                    <ReportStatusHistoryEntry
                                        key={entry.id}
                                        entry={entry}
                                    />
                                ))}
                            </ul>
                        )}
                    </>
                )}
            </div>
        </Modal>
    );
}
