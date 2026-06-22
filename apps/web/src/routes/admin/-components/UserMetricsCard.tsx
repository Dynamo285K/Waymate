import { useTranslation } from "react-i18next";
import {
    AlertIcon,
    Button,
    CarIcon,
    ClockIcon,
    DownloadIcon,
    UserIcon,
    UsersIcon,
} from "@waymate/ui";
import type { AdminDashboardUserMetrics } from "../../../api-client/model/adminDashboardUserMetrics";
import { DashboardCard } from "./DashboardCard";

export function UserMetricsCard({
    metrics,
    loading,
    onExport,
    canExport,
}: {
    metrics: AdminDashboardUserMetrics | undefined;
    loading: boolean;
    onExport: () => void;
    canExport: boolean;
}) {
    const { t } = useTranslation();

    const rows = [
        {
            icon: <UsersIcon />,
            label: "totalRegistered",
            value: metrics?.totalRegistered,
        },
        {
            icon: <UserIcon />,
            label: "activeUsers",
            value: metrics?.activeInLast24h,
        },
        { icon: <CarIcon />, label: "drivers", value: metrics?.drivers },
        {
            icon: <UsersIcon />,
            label: "passengers",
            value: metrics?.passengers,
        },
        {
            icon: <ClockIcon />,
            label: "pendingVerification",
            value: metrics?.pendingVerification,
        },
        {
            icon: <AlertIcon />,
            label: "bannedAccounts",
            value: metrics?.bannedAccounts,
        },
    ];

    return (
        <DashboardCard>
            <h2 className="text-base font-bold text-text-primary mb-4">
                {t("admin.userMetrics")}
            </h2>
            {loading ? (
                <p className="text-sm text-text-secondary">
                    {t("admin.loading")}
                </p>
            ) : (
                <div className="flex flex-col divide-y divide-border">
                    {rows.map((m) => (
                        <div
                            key={m.label}
                            className="flex items-center justify-between py-3"
                        >
                            <div className="flex items-center gap-3 text-text-secondary text-sm">
                                <span className="inline-flex text-base">
                                    {m.icon}
                                </span>
                                {t(`admin.${m.label}`)}
                            </div>
                            <span className="font-bold text-text-primary">
                                {m.value?.toLocaleString() ?? "—"}
                            </span>
                        </div>
                    ))}
                </div>
            )}
            <div className="mt-4">
                <Button
                    variant="secondary"
                    leftIcon={<DownloadIcon />}
                    onClick={onExport}
                    disabled={!canExport}
                >
                    {t("admin.exportReport")}
                </Button>
            </div>
        </DashboardCard>
    );
}
