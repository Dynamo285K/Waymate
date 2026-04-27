import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "../lib/router-compat";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
} from "recharts";
import { AdminNavbar } from "@waymate/ui";
import type { Language } from "@waymate/ui";

type AdminDashboardPageProps = {
    language: Language;
    theme: "light" | "dark";
    onLanguageChange: (lang: Language) => void;
    onThemeToggle: () => void;
    userName?: string;
    userEmail?: string;
};

const WEEKLY_RIDES = [
    { day: "Mo", rides: 42 },
    { day: "Tu", rides: 67 },
    { day: "We", rides: 55 },
    { day: "Th", rides: 78 },
    { day: "Fr", rides: 91 },
    { day: "Sa", rides: 84 },
    { day: "Su", rides: 38 },
];

const WEEKLY_REVENUE = [
    { day: "Mo", eur: 310 },
    { day: "Tu", eur: 480 },
    { day: "We", eur: 390 },
    { day: "Th", eur: 570 },
    { day: "Fr", eur: 650 },
    { day: "Sa", eur: 600 },
    { day: "Su", eur: 260 },
];

const POPULAR_ROUTES = [
    { from: "Praha", to: "Brno", rides: 42, max: 42 },
    { from: "Bratislava", to: "Košice", rides: 38, max: 42 },
    { from: "Praha", to: "Bratislava", rides: 27, max: 42 },
    { from: "Brno", to: "Martin", rides: 23, max: 42 },
    { from: "Žilina", to: "Praha", rides: 19, max: 42 },
];

const USER_METRICS = [
    { icon: "👥", label: "totalRegistered", value: "14 823" },
    { icon: "👤", label: "activeUsers", value: "2 341" },
    { icon: "🚗", label: "drivers", value: "5 210" },
    { icon: "🧍", label: "passengers", value: "9 613" },
    { icon: "⏳", label: "pendingVerification", value: "87" },
    { icon: "🚫", label: "bannedAccounts", value: "34" },
];

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
    userName = "Admin",
    userEmail = "admin@waymate.com",
}: AdminDashboardPageProps) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [, setTab] = useState("dashboard");

    const navLabels = {
        adminRole: t("admin.adminRole"),
        dashboard: t("admin.dashboard"),
        rides: t("admin.rides"),
        users: t("admin.users"),
        reports: t("admin.reports"),
        account: t("admin.account"),
        settings: t("admin.settings"),
        logout: t("admin.logout"),
    };

    const chartColor = "#11ad32";
    const gridColor = "var(--color-border)";

    return (
        <div
            data-theme={theme}
            className="min-h-screen bg-(--color-bg)"
        >
            <AdminNavbar
                activeTab="dashboard"
                language={language}
                onLanguageChange={onLanguageChange}
                theme={theme}
                onThemeToggle={onThemeToggle}
                userName={userName}
                userEmail={userEmail}
                onLogoClick={() => navigate("/admin")}
                onDashboardClick={() => {
                    setTab("dashboard");
                    navigate("/admin");
                }}
                onRidesClick={() => navigate("/admin/rides")}
                onUsersClick={() => navigate("/admin/users")}
                onReportsClick={() => navigate("/admin/reports")}
                onProfileClick={() => navigate("/admin/account")}
                onLogoutClick={() => navigate("/")}
                labels={navLabels}
            />

            <div className="w-full px-4 sm:max-w-6xl sm:mx-auto sm:px-8 py-8 flex flex-col gap-6">
                {/* Charts row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <h2 className="text-base font-bold text-(--color-text-primary) mb-4">
                            {t("admin.weeklyrRides")}
                        </h2>
                        <ResponsiveContainer
                            width="100%"
                            height={200}
                        >
                            <BarChart
                                data={WEEKLY_RIDES}
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
                                    cursor={{ fill: "rgba(17,173,50,0.08)" }}
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
                    </Card>

                    <Card>
                        <h2 className="text-base font-bold text-(--color-text-primary) mb-4">
                            {t("admin.weeklyRevenue")}
                        </h2>
                        <ResponsiveContainer
                            width="100%"
                            height={200}
                        >
                            <BarChart
                                data={WEEKLY_REVENUE}
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
                                    cursor={{ fill: "rgba(17,173,50,0.08)" }}
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
                    </Card>
                </div>

                {/* Bottom row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Popular Routes */}
                    <Card>
                        <h2 className="text-base font-bold text-(--color-text-primary) mb-5">
                            {t("admin.popularRoutes")}
                        </h2>
                        <div className="flex flex-col gap-4">
                            {POPULAR_ROUTES.map((r) => (
                                <div key={`${r.from}-${r.to}`}>
                                    <div className="flex justify-between text-sm mb-1.5">
                                        <span className="font-medium text-(--color-text-primary)">
                                            {r.from} → {r.to}
                                        </span>
                                        <span className="text-(--color-text-secondary)">
                                            {t("admin.ridesCount", {
                                                count: r.rides,
                                            })}
                                        </span>
                                    </div>
                                    <div className="h-2 bg-(--color-border) rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-(--color-primary) rounded-full transition-all"
                                            style={{
                                                width: `${(r.rides / r.max) * 100}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* User Metrics */}
                    <Card>
                        <h2 className="text-base font-bold text-(--color-text-primary) mb-4">
                            {t("admin.userMetrics")}
                        </h2>
                        <div className="flex flex-col divide-y divide-(--color-border)">
                            {USER_METRICS.map((m) => (
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
                                        {m.value}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <button className="mt-4 w-full border border-(--color-border) rounded-xl py-2.5 text-sm text-(--color-text-secondary) hover:bg-(--color-border) transition-colors flex items-center justify-center gap-2">
                            ⬇ {t("admin.exportReport")}
                        </button>
                    </Card>
                </div>
            </div>
        </div>
    );
}
