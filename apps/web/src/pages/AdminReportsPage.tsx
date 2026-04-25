import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AdminNavbar, Button } from "waymate-ui";
import type { Language } from "waymate-ui";

type AdminReportsPageProps = {
    language: Language;
    theme: "light" | "dark";
    onLanguageChange: (lang: Language) => void;
    onThemeToggle: () => void;
    userName?: string;
    userEmail?: string;
};

type ReportStatus = "open" | "resolved";

type Report = {
    id: number;
    reporter: string;
    against: string;
    type: string;
    date: string;
    status: ReportStatus;
    description: string;
};

const REPORTS: Report[] = [
    {
        id: 201,
        reporter: "Jana Horáková",
        against: "Peter Novák",
        type: "Inappropriate behavior",
        date: "22.4.2026",
        status: "open",
        description:
            "Driver was rude and used offensive language during the ride.",
    },
    {
        id: 202,
        reporter: "Lukáš Blaho",
        against: "Peter Novák",
        type: "No-show",
        date: "22.4.2026",
        status: "open",
        description:
            "The driver never arrived at the pickup location and didn't respond to messages.",
    },
    {
        id: 203,
        reporter: "Monika Červená",
        against: "Tomáš Varga",
        type: "Overcharging",
        date: "20.4.2026",
        status: "resolved",
        description:
            "Driver charged more than the agreed price without explanation.",
    },
    {
        id: 204,
        reporter: "Eva Szabóová",
        against: "Jana Horáková",
        type: "Left luggage behind",
        date: "19.4.2026",
        status: "resolved",
        description:
            "Passenger forgot a bag in the car and the driver refused to return it.",
    },
    {
        id: 205,
        reporter: "Martin Kováč",
        against: "Lukáš Blaho",
        type: "No-show",
        date: "18.4.2026",
        status: "open",
        description:
            "Passenger booked a seat but never appeared and didn't cancel in advance.",
    },
];

function StatusBadge({ status }: { status: ReportStatus }) {
    return status === "open" ? (
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-600">
            Open
        </span>
    ) : (
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">
            Resolved
        </span>
    );
}

function ReportModal({
    report,
    onClose,
    onResolve,
}: {
    report: Report;
    onClose: () => void;
    onResolve: (id: number) => void;
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            />
            <div
                className="relative rounded-2xl shadow-2xl w-full max-w-lg p-8"
                style={{ background: "var(--color-card)" }}
            >
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-(--color-text-primary)">
                        Report #{report.id}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-(--color-text-secondary) hover:text-(--color-text-primary) text-xl"
                    >
                        ✕
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-5">
                    {[
                        ["REPORTED BY", report.reporter],
                        ["AGAINST", report.against],
                        ["TYPE", report.type],
                        ["DATE", report.date],
                        [
                            "STATUS",
                            <StatusBadge
                                key="s"
                                status={report.status}
                            />,
                        ],
                    ].map(([label, value]) => (
                        <div key={String(label)}>
                            <p className="text-xs font-bold text-(--color-text-secondary) tracking-wider mb-1">
                                {String(label)}
                            </p>
                            <div className="text-sm font-semibold text-(--color-text-primary)">
                                {value}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mb-6">
                    <p className="text-xs font-bold text-(--color-text-secondary) tracking-wider mb-2">
                        DESCRIPTION
                    </p>
                    <div className="bg-(--color-bg) border border-(--color-border) rounded-xl px-4 py-3 text-sm text-(--color-text-secondary) italic">
                        {report.description}
                    </div>
                </div>

                <div className="flex gap-3 justify-end">
                    <Button
                        variant="secondary"
                        onClick={onClose}
                    >
                        Close
                    </Button>
                    {report.status === "open" && (
                        <Button
                            onClick={() => {
                                onResolve(report.id);
                                onClose();
                            }}
                        >
                            ✓ Mark Resolved
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}

export function AdminReportsPage({
    language,
    theme,
    onLanguageChange,
    onThemeToggle,
    userName = "Admin",
    userEmail = "admin@waymate.com",
}: AdminReportsPageProps) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [filter, setFilter] = useState<"all" | ReportStatus>("all");
    const [viewReport, setViewReport] = useState<Report | null>(null);
    const [reports, setReports] = useState(REPORTS);

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

    const filtered = reports.filter(
        (r) => filter === "all" || r.status === filter
    );
    const openCount = reports.filter((r) => r.status === "open").length;

    function handleResolve(id: number) {
        setReports((prev) =>
            prev.map((r) =>
                r.id === id ? { ...r, status: "resolved" as ReportStatus } : r
            )
        );
    }

    const FILTERS: { key: "all" | ReportStatus; label: string }[] = [
        { key: "all", label: "All" },
        { key: "open", label: "Open" },
        { key: "resolved", label: "Resolved" },
    ];

    return (
        <div
            data-theme={theme}
            className="min-h-screen bg-(--color-bg)"
        >
            <AdminNavbar
                activeTab="reports"
                language={language}
                onLanguageChange={onLanguageChange}
                theme={theme}
                onThemeToggle={onThemeToggle}
                userName={userName}
                userEmail={userEmail}
                onLogoClick={() => navigate("/admin")}
                onDashboardClick={() => navigate("/admin")}
                onRidesClick={() => navigate("/admin/rides")}
                onUsersClick={() => navigate("/admin/users")}
                onReportsClick={() => navigate("/admin/reports")}
                onProfileClick={() => navigate("/admin/account")}
                onLogoutClick={() => navigate("/")}
                labels={navLabels}
            />

            <div className="w-full px-4 sm:max-w-5xl sm:mx-auto sm:px-8 py-8">
                <h1 className="text-2xl font-bold text-(--color-text-primary)">
                    Reports
                </h1>
                <p className="text-(--color-text-secondary) text-sm mt-1 mb-6">
                    Review user reports and dispute resolutions.
                </p>

                {/* Filters + badge */}
                <div className="flex flex-wrap gap-3 mb-6 items-center">
                    <div className="flex gap-1 bg-(--color-card) border border-(--color-border) rounded-xl p-1">
                        {FILTERS.map((f) => (
                            <button
                                key={f.key}
                                onClick={() => setFilter(f.key)}
                                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                                    filter === f.key
                                        ? "bg-(--color-text-primary) text-(--color-card)"
                                        : "text-(--color-text-secondary) hover:text-(--color-text-primary)"
                                }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                    {openCount > 0 && (
                        <span className="flex items-center gap-1.5 bg-red-50 border border-red-200 text-red-600 text-sm font-semibold px-3 py-1.5 rounded-xl">
                            🚩 {openCount} open report
                            {openCount !== 1 ? "s" : ""}
                        </span>
                    )}
                </div>

                {/* Table */}
                <div className="bg-(--color-card) rounded-2xl border border-(--color-border) overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-(--color-border)">
                                {[
                                    "#",
                                    "REPORTER",
                                    "AGAINST",
                                    "TYPE",
                                    "DATE",
                                    "STATUS",
                                    "ACTIONS",
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
                            {filtered.map((report) => (
                                <tr
                                    key={report.id}
                                    className="border-b border-(--color-border) last:border-0 hover:bg-(--color-bg) transition-colors"
                                >
                                    <td className="px-5 py-4 text-(--color-text-secondary)">
                                        {report.id}
                                    </td>
                                    <td className="px-5 py-4 font-medium text-(--color-text-primary) whitespace-nowrap">
                                        {report.reporter}
                                    </td>
                                    <td className="px-5 py-4 font-semibold text-red-500 whitespace-nowrap">
                                        {report.against}
                                    </td>
                                    <td className="px-5 py-4 text-(--color-text-secondary)">
                                        {report.type}
                                    </td>
                                    <td className="px-5 py-4 text-(--color-text-secondary) whitespace-nowrap">
                                        {report.date}
                                    </td>
                                    <td className="px-5 py-4">
                                        <StatusBadge status={report.status} />
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() =>
                                                    setViewReport(report)
                                                }
                                                className="px-3 py-1.5 border border-(--color-border) rounded-lg text-sm font-medium text-(--color-text-secondary) hover:bg-(--color-border) transition-colors"
                                            >
                                                Review
                                            </button>
                                            {report.status === "open" && (
                                                <button
                                                    onClick={() =>
                                                        handleResolve(report.id)
                                                    }
                                                    className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-semibold transition-colors"
                                                >
                                                    Resolve
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {viewReport && (
                <ReportModal
                    report={viewReport}
                    onClose={() => setViewReport(null)}
                    onResolve={handleResolve}
                />
            )}
        </div>
    );
}
