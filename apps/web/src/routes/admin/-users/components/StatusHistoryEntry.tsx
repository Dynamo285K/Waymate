import { useTranslation } from "react-i18next";
import type { AdminUserStatusHistoryItem } from "../../../../api-client/model/adminUserStatusHistoryItem";
import {
    fullName,
    formatDate,
} from "../../../../features/admin/lib/admin-format";
import { useStatusLabels } from "../lib/admin-labels";

export function StatusHistoryEntry({
    entry,
}: {
    entry: AdminUserStatusHistoryItem;
}) {
    const { t } = useTranslation();
    const labels = useStatusLabels();
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
        <li className="border border-border rounded-xl p-3">
            <div className="flex justify-between items-start gap-3">
                <p className="text-sm font-semibold text-text-primary">
                    {transition}
                </p>
                <p className="text-xs text-text-secondary shrink-0">
                    {formatDate(entry.createdAt, "—")}
                </p>
            </div>
            <p className="text-xs text-text-secondary mt-1">
                {t("admin.changedBy", { name: actorName })}
            </p>
            {entry.reason && (
                <p className="text-sm text-text-primary mt-2 whitespace-pre-wrap">
                    {entry.reason}
                </p>
            )}
        </li>
    );
}
