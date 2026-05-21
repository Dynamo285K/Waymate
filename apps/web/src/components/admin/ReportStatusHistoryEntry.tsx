import { useTranslation } from "react-i18next";
import type { AdminReportStatusHistoryItem } from "../../api-client/model/adminReportStatusHistoryItem";
import { fullName, formatDate } from "../../lib/admin-format";
import { useReportStatusLabels } from "../../lib/admin-report-labels";

export function ReportStatusHistoryEntry({
    entry,
}: {
    entry: AdminReportStatusHistoryItem;
}) {
    const { t } = useTranslation();
    const labels = useReportStatusLabels();
    const transition = entry.oldStatus
        ? t("admin.statusTransition", {
              from: labels[entry.oldStatus],
              to: labels[entry.newStatus],
          })
        : t("admin.initialStatus", { to: labels[entry.newStatus] });
    const actorName = entry.changedBy
        ? fullName(entry.changedBy.firstName, entry.changedBy.lastName) ||
          t("admin.systemAction")
        : t("admin.systemAction");
    return (
        <li className="border border-(--color-border) rounded-xl p-3">
            <div className="flex justify-between items-start gap-3">
                <p className="text-sm font-semibold text-(--color-text-primary)">
                    {transition}
                </p>
                <p className="text-xs text-(--color-text-secondary) shrink-0">
                    {formatDate(entry.createdAt, "—")}
                </p>
            </div>
            <p className="text-xs text-(--color-text-secondary) mt-1">
                {t("admin.changedBy", { name: actorName })}
            </p>
            {entry.reason && (
                <p className="text-sm text-(--color-text-primary) mt-2 whitespace-pre-wrap">
                    {entry.reason}
                </p>
            )}
        </li>
    );
}
