import { useTranslation } from "react-i18next";
import { Button } from "@waymate/ui";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
} from "recharts";
import type { Language } from "../components/controls/LanguageSwitcher";
import { AdminNavbar } from "../components/navigation/AdminNavbar";
import { useAdminNavbarProps } from "../hooks/useAdminNavbarProps";
import { useGetAdminDashboard } from "../api-client/admin/admin";

type AdminDashboardPageProps = {
    language: Language;
    theme: "light" | "dark";
    onLanguageChange: (lang: Language) => void;
    onThemeToggle: () => void;
    userName?: string;
    userEmail?: string;
};

function getLast7Days(): { date: string; dayLabel: string }[] {
    const days = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const dateStr = d.toISOString().slice(0, 10);
        const dayLabel = d
            .toLocaleDateString("en-US", { weekday: "short" })
            .slice(0, 2);
        days.push({ date: dateStr, dayLabel });
    }
    return days;
}

function fillWeeklyRides(data: { date: string; count: number }[]) {
    const map = new Map(data.map((d) => [d.date, d.count]));
    return getLast7Days().map(({ date, dayLabel }) => ({
        day: dayLabel,
        rides: map.get(date) ?? 0,
    }));
}

function fillWeeklyRevenue(data: { date: string; totalCents: number }[]) {
    const map = new Map(data.map((d) => [d.date, d.totalCents]));
    return getLast7Days().map(({ date, dayLabel }) => ({
        day: dayLabel,
        eur: (map.get(date) ?? 0) / 100,
    }));
}

function Card({
    children,
    className = "",
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div
            className={`bg-(--color-card) rounded-2xl border border-(--color-border) p-6 ${className}`}
        >
            {children}
        </div>
    );
}

export function AdminDashboardPage({
    language,
    theme,
    onLanguageChange,
    onThemeToggle,
    userName,
    userEmail,
}: AdminDashboardPageProps) {
    const { t } = useTranslation();
    const navbarProps = useAdminNavbarProps({
        activeTab: "dashboard",
        language,
        onLanguageChange,
        theme,
        onThemeToggle,
        userName,
        userEmail,
    });

    const { data: dashboard, isLoading, isError } = useGetAdminDashboard();

    const chartColor = "var(--color-primary)";
    const chartCursorFill =
        "color-mix(in srgb, var(--color-primary) 8%, transparent)";
    const gridColor = "var(--color-border)";

    const weeklyRides = dashboard ? fillWeeklyRides(dashboard.weeklyRides) : [];
    const weeklyRevenue = dashboard
        ? fillWeeklyRevenue(dashboard.weeklyRevenue)
        : [];
    const popularRoutes = dashboard?.popularRoutes ?? [];
    const popularRoutesMax = popularRoutes[0]?.count ?? 1;
    const userMetrics = dashboard?.userMetrics;

    const USER_METRIC_ROWS = [
        {
            icon: "👥",
            label: "totalRegistered",
            value: userMetrics?.totalRegistered,
        },
        {
            icon: "👤",
            label: "activeUsers",
            value: userMetrics?.activeInLast24h,
        },
        { icon: "🚗", label: "drivers", value: userMetrics?.drivers },
        { icon: "🧍", label: "passengers", value: userMetrics?.passengers },
        {
            icon: "⏳",
            label: "pendingVerification",
            value: userMetrics?.pendingVerification,
        },
        {
            icon: "🚫",
            label: "bannedAccounts",
            value: userMetrics?.bannedAccounts,
        },
    ];

    const handleExport = () => {
        if (!dashboard) return;
        const lines = [
            `Dashboard Export — ${new Date().toLocaleDateString()}`,
            "",
            "=== User Metrics ===",
            `Total Registered: ${dashboard.userMetrics.totalRegistered}`,
            `Active (24h): ${dashboard.userMetrics.activeInLast24h}`,
            `Drivers: ${dashboard.userMetrics.drivers}`,
            `Passengers: ${dashboard.userMetrics.passengers}`,
            `Pending Verification: ${dashboard.userMetrics.pendingVerification}`,
            `Banned: ${dashboard.userMetrics.bannedAccounts}`,
            "",
            "=== Popular Routes ===",
            ...dashboard.popularRoutes.map(
                (r) =>
                    `${r.originCity} → ${r.destinationCity}: ${r.count} rides`
            ),
            "",
            "=== Weekly Rides ===",
            ...dashboard.weeklyRides.map((r) => `${r.date}: ${r.count}`),
            "",
            "=== Weekly Revenue (EUR) ===",
            ...dashboard.weeklyRevenue.map(
                (r) => `${r.date}: ${(r.totalCents / 100).toFixed(2)} EUR`
            ),
        ];
        const blob = new Blob([lines.join("\n")], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `dashboard-${new Date().toISOString().slice(0, 10)}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div
            data-theme={theme}
            className="min-h-screen bg-(--color-bg)"
        >
            <AdminNavbar {...navbarProps} />

            <div className="w-full px-4 sm:max-w-6xl sm:mx-auto sm:px-8 py-8 flex flex-col gap-6">
                {isError && (
                    <p className="text-sm text-(--color-text-secondary) text-center py-8">
                        {t("admin.dashboardLoadError")}
                    </p>
                )}

                {/* Charts row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <h2 className="text-base font-bold text-(--color-text-primary) mb-4">
                            {t("admin.weeklyrRides")}
                        </h2>
                        {isLoading ? (
                            <div className="h-50 flex items-center justify-center">
                                <span className="text-sm text-(--color-text-secondary)">
                                    {t("admin.loading")}
                                </span>
                            </div>
                        ) : (
                            <ResponsiveContainer
                                width="100%"
                                height={200}
                            >
                                <BarChart
                                    data={weeklyRides}
                                    barSize={28}
                                >
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke={gridColor}
                                        vertical={false}
                                    />
                                    <XAxis
                                        dataKey="day"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{
                                            fontSize: 12,
                                            fill: "var(--color-text-secondary)",
                                        }}
                                    />
                                    <YAxis hide />
                                    <Tooltip
                                        cursor={{ fill: chartCursorFill }}
                                        contentStyle={{
                                            borderRadius: 10,
                                            border: "1px solid var(--color-border)",
                                            background: "var(--color-card)",
                                        }}
                                    />
                                    <Bar
                                        dataKey="rides"
                                        fill={chartColor}
                                        radius={[6, 6, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </Card>

                    <Card>
                        <h2 className="text-base font-bold text-(--color-text-primary) mb-4">
                            {t("admin.weeklyRevenue")}
                        </h2>
                        {isLoading ? (
                            <div className="h-50 flex items-center justify-center">
                                <span className="text-sm text-(--color-text-secondary)">
                                    {t("admin.loading")}
                                </span>
                            </div>
                        ) : (
                            <ResponsiveContainer
                                width="100%"
                                height={200}
                            >
                                <BarChart
                                    data={weeklyRevenue}
                                    barSize={28}
                                >
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke={gridColor}
                                        vertical={false}
                                    />
                                    <XAxis
                                        dataKey="day"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{
                                            fontSize: 12,
                                            fill: "var(--color-text-secondary)",
                                        }}
                                    />
                                    <YAxis hide />
                                    <Tooltip
                                        cursor={{ fill: chartCursorFill }}
                                        contentStyle={{
                                            borderRadius: 10,
                                            border: "1px solid var(--color-border)",
                                            background: "var(--color-card)",
                                        }}
                                    />
                                    <Bar
                                        dataKey="eur"
                                        fill={chartColor}
                                        radius={[6, 6, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </Card>
                </div>

                {/* Bottom row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Popular Routes */}
                    <Card>
                        <h2 className="text-base font-bold text-(--color-text-primary) mb-5">
                            {t("admin.popularRoutes")}
                        </h2>
                        {isLoading ? (
                            <p className="text-sm text-(--color-text-secondary)">
                                {t("admin.loading")}
                            </p>
                        ) : popularRoutes.length === 0 ? (
                            <p className="text-sm text-(--color-text-secondary)">
                                {t("admin.noData")}
                            </p>
                        ) : (
                            <div className="flex flex-col gap-4">
                                {popularRoutes.map((r) => (
                                    <div
                                        key={`${r.originCity}-${r.destinationCity}`}
                                    >
                                        <div className="flex justify-between text-sm mb-1.5">
                                            <span className="font-medium text-(--color-text-primary)">
                                                {r.originCity} →{" "}
                                                {r.destinationCity}
                                            </span>
                                            <span className="text-(--color-text-secondary)">
                                                {t("admin.ridesCount", {
                                                    count: r.count,
                                                })}
                                            </span>
                                        </div>
                                        <div className="h-2 bg-(--color-border) rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-(--color-primary) rounded-full transition-all"
                                                style={{
                                                    width: `${(r.count / popularRoutesMax) * 100}%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>

                    {/* User Metrics */}
                    <Card>
                        <h2 className="text-base font-bold text-(--color-text-primary) mb-4">
                            {t("admin.userMetrics")}
                        </h2>
                        {isLoading ? (
                            <p className="text-sm text-(--color-text-secondary)">
                                {t("admin.loading")}
                            </p>
                        ) : (
                            <div className="flex flex-col divide-y divide-(--color-border)">
                                {USER_METRIC_ROWS.map((m) => (
                                    <div
                                        key={m.label}
                                        className="flex items-center justify-between py-3"
                                    >
                                        <div className="flex items-center gap-3 text-(--color-text-secondary) text-sm">
                                            <span className="text-base">
                                                {m.icon}
                                            </span>
                                            {t(`admin.${m.label}`)}
                                        </div>
                                        <span className="font-bold text-(--color-text-primary)">
                                            {m.value?.toLocaleString() ?? "—"}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="mt-4">
                            <Button
                                variant="secondary"
                                onClick={handleExport}
                                disabled={!dashboard}
                            >
                                ⬇ {t("admin.exportReport")}
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
