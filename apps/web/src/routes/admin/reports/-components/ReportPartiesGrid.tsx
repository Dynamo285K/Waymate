import { useTranslation } from "react-i18next";
import { Avatar, BanIcon, Button } from "@waymate/ui";
import type { AdminReportDetail } from "../../../../api-client/model/adminReportDetail";

const labelClass =
    "text-xs font-bold text-text-secondary tracking-wider mb-1 block";

type ReportPartiesGridProps = {
    report: AdminReportDetail;
    reporterName: string;
    targetName: string;
    onBanTarget: (target: { id: string; name: string }) => void;
};

export function ReportPartiesGrid({
    report,
    reporterName,
    targetName,
    onBanTarget,
}: ReportPartiesGridProps) {
    const { t } = useTranslation();

    return (
        <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="border border-border rounded-xl p-4">
                <p className={labelClass}>{t("admin.reports.reporter")}</p>
                <div className="flex items-center gap-2">
                    <Avatar
                        name={reporterName}
                        size="sm"
                    />
                    <div>
                        <p className="text-sm font-semibold text-text-primary">
                            {reporterName}
                        </p>
                        <p className="text-xs text-text-secondary">
                            {report.reporter.email}
                        </p>
                    </div>
                </div>
            </div>
            <div className="border border-border rounded-xl p-4">
                <p className={labelClass}>{t("admin.reports.target")}</p>
                <div className="flex items-center gap-2">
                    <Avatar
                        name={targetName}
                        size="sm"
                    />
                    <div>
                        <p className="text-sm font-semibold text-text-primary">
                            {targetName}
                        </p>
                        <p className="text-xs text-text-secondary">
                            {report.target.email}
                        </p>
                    </div>
                </div>
                {report.target.userStatus === "BANNED" ? (
                    <p className="text-xs font-semibold text-danger-text mt-3">
                        {t("admin.reports.targetAlreadyBanned")}
                    </p>
                ) : (
                    report.target.userStatus !== "DELETED" && (
                        <Button
                            variant="red"
                            leftIcon={<BanIcon />}
                            className="mt-3"
                            onClick={() =>
                                onBanTarget({
                                    id: report.target.id,
                                    name: targetName,
                                })
                            }
                        >
                            {t("admin.banUser")}
                        </Button>
                    )
                )}
            </div>
        </div>
    );
}
