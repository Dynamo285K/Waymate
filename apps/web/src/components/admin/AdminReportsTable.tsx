import { useTranslation } from "react-i18next";
import { Avatar, Button } from "@waymate/ui";
import type { AdminReportListItem } from "../../api-client/model/adminReportListItem";
import { fullName, formatDate } from "../../lib/admin-format";
import { useReportTypeLabels } from "../../lib/admin-report-labels";
import { ReportStatusBadge } from "./ReportStatusBadge";

type AdminReportsTableProps = {
    items: AdminReportListItem[];
    rowMutatingId: string | null;
    onView: (report: AdminReportListItem) => void;
};

export function AdminReportsTable({
    items,
    rowMutatingId,
    onView,
}: AdminReportsTableProps) {
    const { t } = useTranslation();
    const typeLabels = useReportTypeLabels();

    return (
        <div className="bg-(--color-card) rounded-2xl border border-(--color-border) overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-(--color-border)">
                        {[
                            t("admin.reports.reporter"),
                            t("admin.reports.target"),
                            t("admin.reports.type"),
                            t("admin.reports.description"),
                            t("admin.status"),
                            t("admin.created"),
                            t("admin.actions"),
                        ].map((h) => (
                            <th
                                key={h}
                                className="text-left text-xs font-bold text-(--color-text-secondary) tracking-wider px-5 py-4"
                            >
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {items.map((report) => {
                        const reporterName =
                            fullName(
                                report.reporter.firstName,
                                report.reporter.lastName
                            ) || report.reporter.email;
                        const targetName =
                            fullName(
                                report.target.firstName,
                                report.target.lastName
                            ) || report.target.email;
                        const isThisRowMutating = rowMutatingId === report.id;
                        return (
                            <tr
                                key={report.id}
                                className={`border-b border-(--color-border) last:border-0 hover:bg-(--color-bg) transition-colors ${
                                    isThisRowMutating ? "opacity-60" : ""
                                }`}
                            >
                                <td className="px-5 py-4">
                                    <div className="flex items-center gap-2">
                                        <Avatar
                                            name={reporterName}
                                            size="sm"
                                        />
                                        <span className="font-semibold text-(--color-text-primary) whitespace-nowrap">
                                            {reporterName}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-5 py-4">
                                    <div className="flex items-center gap-2">
                                        <Avatar
                                            name={targetName}
                                            size="sm"
                                        />
                                        <span className="font-semibold text-(--color-text-primary) whitespace-nowrap">
                                            {targetName}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-5 py-4 text-(--color-text-secondary) whitespace-nowrap">
                                    {typeLabels[report.reportType]}
                                </td>
                                <td className="px-5 py-4 max-w-md">
                                    <p className="text-(--color-text-primary) line-clamp-2">
                                        {report.description}
                                    </p>
                                </td>
                                <td className="px-5 py-4">
                                    <ReportStatusBadge
                                        status={report.reportStatus}
                                    />
                                </td>
                                <td className="px-5 py-4 text-(--color-text-secondary) whitespace-nowrap">
                                    {formatDate(report.createdAt, "—")}
                                </td>
                                <td className="px-5 py-4">
                                    <Button
                                        variant="secondary"
                                        onClick={() => onView(report)}
                                    >
                                        {t("admin.view")}
                                    </Button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
