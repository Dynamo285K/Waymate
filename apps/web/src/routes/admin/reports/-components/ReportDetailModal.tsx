import { useTranslation } from "react-i18next";
import { CloseIcon, IconButton, Modal } from "@waymate/ui";
import { useGetReportsAdminById } from "../../../../api-client/reports/reports";
import type { ReportStatus } from "../../../../api-client/model/reportStatus";
import { getErrorI18nKey } from "../../../../lib/api-errors";
import { adminReportsErrorMap } from "../-lib/admin-report-errors";
import {
    fullName,
    formatDate,
} from "../../../../features/admin/lib/admin-format";
import { useReportTypeLabels } from "../-lib/admin-report-labels";
import { ReportStatusBadge } from "./ReportStatusBadge";
import { ReportStatusHistoryEntry } from "./ReportStatusHistoryEntry";
import { ReportConversation } from "./ReportConversation";
import { ReportPartiesGrid } from "./ReportPartiesGrid";
import { ReportStatusActions } from "./ReportStatusActions";

type ReportDetailModalProps = {
    theme: "light" | "dark";
    reportId: string;
    isThisReportMutating: boolean;
    mutationErrorForThisReport: unknown;
    onClose: () => void;
    onRequestStatus: (target: ReportStatus) => void;
    onBanTarget: (target: { id: string; name: string }) => void;
};

export function ReportDetailModal({
    theme,
    reportId,
    isThisReportMutating,
    mutationErrorForThisReport,
    onClose,
    onRequestStatus,
    onBanTarget,
}: ReportDetailModalProps) {
    const { t } = useTranslation();
    const detailQuery = useGetReportsAdminById(reportId);
    const typeLabels = useReportTypeLabels();

    const labelClass =
        "text-xs font-bold text-text-secondary tracking-wider mb-1 block";

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

    return (
        <Modal
            open={true}
            onClose={onClose}
            theme={theme}
        >
            <div className="w-modal-viewport max-w-2xl p-8 max-h-modal-body overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-text-primary">
                        {t("admin.reports.detailTitle")}
                    </h2>
                    <IconButton
                        ariaLabel="Close"
                        icon={<CloseIcon />}
                        variant="ghost"
                        onClick={onClose}
                    />
                </div>

                {detailQuery.isLoading && (
                    <p className="text-text-secondary">
                        {t("admin.reports.loading")}
                    </p>
                )}

                {!detailQuery.isLoading && detailQuery.isError && (
                    <p className="text-danger-text">
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
                            <span className="text-sm font-semibold text-text-primary">
                                {typeLabels[data.report.reportType]}
                            </span>
                            <ReportStatusBadge
                                status={data.report.reportStatus}
                            />
                        </div>

                        <ReportPartiesGrid
                            report={data.report}
                            reporterName={reporterName}
                            targetName={targetName}
                            onBanTarget={onBanTarget}
                        />

                        {data.report.ride && (
                            <div className="border border-border rounded-xl p-4 mb-6">
                                <p className={labelClass}>
                                    {t("admin.rideContext")}
                                </p>
                                <p className="text-sm font-semibold text-text-primary">
                                    {data.report.ride.originCity} →{" "}
                                    {data.report.ride.destinationCity}
                                </p>
                                <p className="text-xs text-text-secondary mt-1">
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
                            <p className="text-sm text-text-primary whitespace-pre-wrap border border-border rounded-xl p-3 bg-background">
                                {data.report.description}
                            </p>
                        </div>

                        <ReportConversation
                            reportId={reportId}
                            nameFor={(senderId) =>
                                senderId === data.report.target.id
                                    ? targetName
                                    : senderId === data.report.reporter.id
                                      ? reporterName
                                      : t("chat.unknownUser")
                            }
                        />

                        {data.report.resolutionReason && (
                            <div className="mb-6">
                                <p className={labelClass}>
                                    {t("admin.reports.resolutionReason")}
                                </p>
                                <p className="text-sm text-text-primary whitespace-pre-wrap border border-border rounded-xl p-3 bg-background">
                                    {data.report.resolutionReason}
                                </p>
                            </div>
                        )}

                        {mutationErrorForThisReport !== null &&
                            mutationErrorForThisReport !== undefined && (
                                <p className="text-sm text-danger-text mb-4">
                                    {t(
                                        getErrorI18nKey(
                                            mutationErrorForThisReport,
                                            adminReportsErrorMap
                                        )
                                    )}
                                </p>
                            )}

                        <ReportStatusActions
                            status={data.report.reportStatus}
                            isMutating={isThisReportMutating}
                            onRequestStatus={onRequestStatus}
                        />

                        <h3 className="text-base font-bold text-text-primary mb-3">
                            {t("admin.statusHistory")}
                        </h3>
                        {data.statusHistory.length === 0 ? (
                            <p className="text-sm text-text-secondary">
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
