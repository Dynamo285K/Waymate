import { useTranslation } from "react-i18next";
import { createFileRoute } from "@tanstack/react-router";
import { useGetAdminDashboard } from "../../api-client/admin/admin";
import { useLayout } from "../../lib/use-layout";
import { fillWeeklyRides, fillWeeklyRevenue } from "./-lib/dashboard-data";
import { downloadDashboardReport } from "./-lib/dashboard-export";
import { WeeklyBarChart } from "./-components/WeeklyBarChart";
import { PopularRoutesCard } from "./-components/PopularRoutesCard";
import { UserMetricsCard } from "./-components/UserMetricsCard";

export const Route = createFileRoute("/admin/")({
    component: AdminDashboardPage,
});

function AdminDashboardPage() {
    const { t } = useTranslation();
    const { theme } = useLayout();

    const { data: dashboard, isLoading, isError } = useGetAdminDashboard();

    const weeklyRides = dashboard ? fillWeeklyRides(dashboard.weeklyRides) : [];
    const weeklyRevenue = dashboard
        ? fillWeeklyRevenue(dashboard.weeklyRevenue)
        : [];

    return (
        <div
            data-theme={theme}
            className="min-h-screen bg-background"
        >
            <div className="w-full px-4 sm:max-w-6xl sm:mx-auto sm:px-8 py-8 flex flex-col gap-6">
                {isError && (
                    <p className="text-sm text-text-secondary text-center py-8">
                        {t("admin.dashboardLoadError")}
                    </p>
                )}

                {/* Charts row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <WeeklyBarChart
                        title={t("admin.weeklyrRides")}
                        loadingLabel={t("admin.loading")}
                        loading={isLoading}
                        data={weeklyRides}
                        dataKey="rides"
                    />
                    <WeeklyBarChart
                        title={t("admin.weeklyRevenue")}
                        loadingLabel={t("admin.loading")}
                        loading={isLoading}
                        data={weeklyRevenue}
                        dataKey="eur"
                    />
                </div>

                {/* Bottom row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <PopularRoutesCard
                        routes={dashboard?.popularRoutes ?? []}
                        loading={isLoading}
                    />
                    <UserMetricsCard
                        metrics={dashboard?.userMetrics}
                        loading={isLoading}
                        canExport={Boolean(dashboard)}
                        onExport={() => {
                            if (dashboard) downloadDashboardReport(dashboard);
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
