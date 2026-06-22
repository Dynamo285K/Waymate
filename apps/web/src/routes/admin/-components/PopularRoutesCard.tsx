import type { CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import type { AdminDashboardPopularRoute } from "../../../api-client/model/adminDashboardPopularRoute";
import { DashboardCard } from "./DashboardCard";

export function PopularRoutesCard({
    routes,
    loading,
}: {
    routes: AdminDashboardPopularRoute[];
    loading: boolean;
}) {
    const { t } = useTranslation();
    const max = routes[0]?.count ?? 1;

    return (
        <DashboardCard>
            <h2 className="text-base font-bold text-text-primary mb-5">
                {t("admin.popularRoutes")}
            </h2>
            {loading ? (
                <p className="text-sm text-text-secondary">
                    {t("admin.loading")}
                </p>
            ) : routes.length === 0 ? (
                <p className="text-sm text-text-secondary">
                    {t("admin.noData")}
                </p>
            ) : (
                <div className="flex flex-col gap-4">
                    {routes.map((r) => (
                        <div key={`${r.originCity}-${r.destinationCity}`}>
                            <div className="flex justify-between text-sm mb-1.5">
                                <span className="font-medium text-text-primary">
                                    {r.originCity} → {r.destinationCity}
                                </span>
                                <span className="text-text-secondary">
                                    {t("admin.ridesCount", { count: r.count })}
                                </span>
                            </div>
                            <div className="h-2 bg-border rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary rounded-full transition-all w-[var(--bar-width)]"
                                    style={
                                        {
                                            "--bar-width": `${(r.count / max) * 100}%`,
                                        } as CSSProperties
                                    }
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </DashboardCard>
    );
}
