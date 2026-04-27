import { useState } from "react";
import { useNavigate } from "../lib/router-compat";
import { useTranslation } from "react-i18next";
import { AdminNavbar, Avatar, Button } from "@waymate/ui";
import type { Language } from "@waymate/ui";
import { useLogout } from "../hooks/useLogout";

type AdminUsersPageProps = {
    language: Language;
    theme: "light" | "dark";
    onLanguageChange: (lang: Language) => void;
    onThemeToggle: () => void;
    userName?: string;
    userEmail?: string;
};

type UserStatus = "active" | "banned" | "pending";
type UserRole = "driver" | "passenger";

type User = {
    id: number;
    name: string;
    email: string;
    role: UserRole;
    spz: string | null;
    rating: number | null;
    rides: number;
    status: UserStatus;
    phone: string;
    memberSince: string;
};

const USERS: User[] = [
    {
        id: 1,
        name: "Martin Kováč",
        email: "martin.kovac@gmail.com",
        role: "driver",
        spz: "BA-123AB",
        rating: 4.9,
        rides: 87,
        status: "active",
        phone: "+421 900 111 222",
        memberSince: "12.1.2024",
    },
    {
        id: 2,
        name: "Jana Horáková",
        email: "jana.horakova@email.cz",
        role: "passenger",
        spz: null,
        rating: 4.7,
        rides: 23,
        status: "active",
        phone: "+420 732 456 789",
        memberSince: "3.5.2024",
    },
    {
        id: 3,
        name: "Peter Novák",
        email: "peter.novak@centrum.sk",
        role: "driver",
        spz: "TN-555CC",
        rating: 2.1,
        rides: 12,
        status: "banned",
        phone: "+421 911 222 333",
        memberSince: "8.9.2023",
    },
    {
        id: 4,
        name: "Eva Szabóová",
        email: "eva.szabo@gmail.com",
        role: "driver",
        spz: "NR-876DD",
        rating: 4.8,
        rides: 144,
        status: "active",
        phone: "+421 905 333 444",
        memberSince: "15.2.2023",
    },
    {
        id: 5,
        name: "Lukáš Blaho",
        email: "lukas.blaho@post.sk",
        role: "passenger",
        spz: null,
        rating: null,
        rides: 0,
        status: "pending",
        phone: "+421 950 555 666",
        memberSince: "20.4.2026",
    },
    {
        id: 6,
        name: "Tomáš Varga",
        email: "tomas.varga@gmail.com",
        role: "driver",
        spz: "ZA-214EF",
        rating: 4.5,
        rides: 61,
        status: "active",
        phone: "+421 918 777 888",
        memberSince: "1.11.2023",
    },
    {
        id: 7,
        name: "Monika Červená",
        email: "monika.cervena@email.cz",
        role: "passenger",
        spz: null,
        rating: 4.6,
        rides: 18,
        status: "active",
        phone: "+420 608 999 000",
        memberSince: "14.7.2024",
    },
    {
        id: 8,
        name: "Róbert Krasňan",
        email: "robert.krasnan@atlas.sk",
        role: "driver",
        spz: "KE-099GH",
        rating: 1.8,
        rides: 5,
        status: "banned",
        phone: "+421 944 111 222",
        memberSince: "5.3.2025",
    },
];

function StatusBadge({ status }: { status: UserStatus }) {
    const { t } = useTranslation();
    const s: Record<UserStatus, string> = {
        active: "border border-green-400 text-green-600 bg-green-50",
        banned: "bg-red-100 text-red-600",
        pending: "bg-amber-100 text-amber-600",
    };
    const labels: Record<UserStatus, string> = {
        active: t("admin.active"),
        banned: t("admin.banned"),
        pending: t("admin.pending"),
    };
    return (
        <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${s[status]}`}
        >
            {labels[status]}
        </span>
    );
}

function RatingDisplay({ rating }: { rating: number | null }) {
    if (rating === null)
        return <span className="text-(--color-text-secondary)">★ -</span>;
    const color = rating >= 4 ? "text-green-600" : "text-red-500";
    return <span className={`font-semibold ${color}`}>★ {rating}</span>;
}

/* ── View + Edit modal ── */
function UserProfileModal({
    user,
    onClose,
    onBan,
    onSave,
}: {
    user: User;
    onClose: () => void;
    onBan: () => void;
    onSave: (id: number, data: Partial<User>) => void;
}) {
    const { t } = useTranslation();
    const [editing, setEditing] = useState(false);
    const [name, setName] = useState(user.name);
    const [email, setEmail] = useState(user.email);
    const [phone, setPhone] = useState(user.phone);
    const [spz, setSpz] = useState(user.spz ?? "");
    const [role, setRole] = useState<UserRole>(user.role);

    const inputClass =
        "w-full border border-(--color-border) rounded-xl bg-(--color-input-bg) text-(--color-text-primary) px-3 py-2.5 text-sm outline-none focus:border-(--color-primary) transition-colors";
    const labelClass =
        "text-xs font-bold text-(--color-text-secondary) tracking-wider mb-1 block";

    function handleSave() {
        onSave(user.id, { name, email, phone, spz: spz || null, role });
        setEditing(false);
    }

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
                        {editing
                            ? t("admin.editProfile")
                            : t("admin.userProfile")}
                    </h2>
                    <button
                        onClick={editing ? () => setEditing(false) : onClose}
                        className="text-(--color-text-secondary) hover:text-(--color-text-primary) text-xl"
                    >
                        ✕
                    </button>
                </div>

                <div className="flex items-center gap-4 mb-6">
                    <Avatar
                        name={name}
                        size="lg"
                    />
                    <div>
                        <p className="text-lg font-bold text-(--color-text-primary)">
                            {name}
                        </p>
                        <p className="text-sm text-(--color-text-secondary) mb-1">
                            {email}
                        </p>
                        <StatusBadge status={user.status} />
                    </div>
                </div>

                {!editing ? (
                    /* ── View mode ── */
                    <>
                        <div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-6">
                            {[
                                [t("admin.phone"), user.phone],
                                [t("admin.role"), t(`admin.${user.role}`)],
                                [t("admin.spzPlate"), user.spz ?? "-"],
                                [t("admin.memberSince"), user.memberSince],
                                [t("admin.totalRides"), String(user.rides)],
                                [
                                    t("admin.rating"),
                                    user.rating !== null
                                        ? String(user.rating)
                                        : "-",
                                ],
                            ].map(([label, value]) => (
                                <div key={String(label)}>
                                    <p className={labelClass}>{label}</p>
                                    <p className="text-sm font-semibold text-(--color-text-primary)">
                                        {value}
                                    </p>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            <Button
                                variant="secondary"
                                onClick={() => setEditing(true)}
                            >
                                ✎ {t("admin.editProfile")}
                            </Button>
                            <Button variant="secondary">
                                ↺ {t("admin.resetPassword")}
                            </Button>
                            {user.status !== "banned" && (
                                <Button
                                    variant="red"
                                    onClick={onBan}
                                >
                                    {t("admin.banUser")}
                                </Button>
                            )}
                        </div>
                    </>
                ) : (
                    /* ── Edit mode ── */
                    <>
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div>
                                <label className={labelClass}>
                                    {t("admin.name")}
                                </label>
                                <input
                                    className={inputClass}
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>
                                    {t("admin.email")}
                                </label>
                                <input
                                    className={inputClass}
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>
                                    {t("admin.phone")}
                                </label>
                                <input
                                    className={inputClass}
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>
                                    {t("admin.role")}
                                </label>
                                <select
                                    className={inputClass + " cursor-pointer"}
                                    value={role}
                                    onChange={(e) =>
                                        setRole(e.target.value as UserRole)
                                    }
                                >
                                    <option value="driver">
                                        {t("admin.driver")}
                                    </option>
                                    <option value="passenger">
                                        {t("admin.passenger")}
                                    </option>
                                </select>
                            </div>
                            <div className="col-span-2">
                                <label className={labelClass}>
                                    {t("admin.spzPlate")}
                                </label>
                                <input
                                    className={inputClass}
                                    value={spz}
                                    onChange={(e) =>
                                        setSpz(e.target.value.toUpperCase())
                                    }
                                    placeholder="e.g. BA-123AB"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 justify-end">
                            <Button
                                variant="secondary"
                                onClick={() => setEditing(false)}
                            >
                                {t("admin.cancel")}
                            </Button>
                            <Button onClick={handleSave}>
                                {t("admin.saveChanges")}
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

/* ── Ban modal ── */
function BanUserModal({
    user,
    onClose,
    onConfirm,
}: {
    user: User;
    onClose: () => void;
    onConfirm: (id: number) => void;
}) {
    const { t } = useTranslation();
    const [banType, setBanType] = useState<"temporary" | "permanent">(
        "temporary"
    );
    const [days, setDays] = useState("7");
    const [reason, setReason] = useState("");

    const inputClass =
        "w-full border border-(--color-border) rounded-xl bg-(--color-input-bg) text-(--color-text-primary) px-4 py-3 text-sm outline-none focus:border-(--color-primary) transition-colors";

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
                <div className="flex justify-between items-center mb-5">
                    <h2 className="text-xl font-bold text-(--color-text-primary)">
                        {t("admin.banUser")} — {user.name}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-(--color-text-secondary) hover:text-(--color-text-primary) text-xl"
                    >
                        ✕
                    </button>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5 text-sm text-red-700">
                    {t("admin.banWarning")}
                </div>

                <div className="mb-4">
                    <p className="text-sm font-semibold text-(--color-text-primary) mb-2">
                        {t("admin.banType")}
                    </p>
                    <div className="flex gap-5">
                        {(["temporary", "permanent"] as const).map((type) => (
                            <label
                                key={type}
                                className="flex items-center gap-2 cursor-pointer text-sm text-(--color-text-primary)"
                            >
                                <input
                                    type="radio"
                                    name="banType"
                                    checked={banType === type}
                                    onChange={() => setBanType(type)}
                                    className="accent-green-500 w-4 h-4"
                                />
                                {type === "temporary"
                                    ? t("admin.temporary")
                                    : t("admin.permanent")}
                            </label>
                        ))}
                    </div>
                </div>

                {banType === "temporary" && (
                    <div className="mb-4">
                        <label className="text-sm font-semibold text-(--color-text-primary) mb-1.5 block">
                            {t("admin.duration")}
                        </label>
                        <input
                            className={inputClass}
                            type="number"
                            min="1"
                            value={days}
                            onChange={(e) => setDays(e.target.value)}
                        />
                    </div>
                )}

                <div className="mb-6">
                    <label className="text-sm font-semibold text-(--color-text-primary) mb-1.5 block">
                        {t("admin.reasonForBan")}
                    </label>
                    <textarea
                        className={inputClass + " resize-y min-h-25"}
                        placeholder={t("admin.reasonPlaceholder")}
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                    />
                </div>

                <div className="flex gap-3 justify-end">
                    <Button
                        variant="secondary"
                        onClick={onClose}
                    >
                        {t("admin.cancel")}
                    </Button>
                    <Button
                        variant="red"
                        onClick={() => {
                            onConfirm(user.id);
                            onClose();
                        }}
                    >
                        ⊘ {t("admin.confirmBan")}
                    </Button>
                </div>
            </div>
        </div>
    );
}

/* ── Main page ── */
export function AdminUsersPage({
    language,
    theme,
    onLanguageChange,
    onThemeToggle,
    userName = "Admin",
    userEmail = "admin@waymate.com",
}: AdminUsersPageProps) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const logout = useLogout();
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [viewUser, setViewUser] = useState<User | null>(null);
    const [banUser, setBanUser] = useState<User | null>(null);
    const [users, setUsers] = useState(USERS);

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

    const filtered = users.filter((u) => {
        const q = search.toLowerCase();
        const matchSearch =
            !q ||
            u.name.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q) ||
            (u.spz ?? "").toLowerCase().includes(q);
        const matchRole = roleFilter === "all" || u.role === roleFilter;
        const matchStatus = statusFilter === "all" || u.status === statusFilter;
        return matchSearch && matchRole && matchStatus;
    });

    function handleBan(id: number) {
        setUsers((prev) =>
            prev.map((u) =>
                u.id === id ? { ...u, status: "banned" as UserStatus } : u
            )
        );
    }

    function handleUnban(id: number) {
        setUsers((prev) =>
            prev.map((u) =>
                u.id === id ? { ...u, status: "active" as UserStatus } : u
            )
        );
    }

    const selectClass =
        "border border-(--color-border) rounded-lg bg-(--color-card) text-(--color-text-primary) text-sm px-3 py-2 outline-none cursor-pointer";

    return (
        <div
            data-theme={theme}
            className="min-h-screen bg-(--color-bg)"
        >
            <AdminNavbar
                activeTab="users"
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
                onLogoutClick={logout}
                labels={navLabels}
            />

            <div className="w-full px-4 sm:max-w-6xl sm:mx-auto sm:px-8 py-8">
                <h1 className="text-2xl font-bold text-(--color-text-primary)">
                    {t("admin.usersTitle")}
                </h1>
                <p className="text-(--color-text-secondary) text-sm mt-1 mb-6">
                    {t("admin.usersSubtitle")}
                </p>

                {/* Filters */}
                <div className="flex flex-col gap-3 mb-6">
                    <div className="flex items-center gap-2 border border-(--color-border) rounded-xl px-3 py-2 bg-(--color-card) w-full sm:max-w-sm">
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className="text-(--color-text-secondary) shrink-0"
                        >
                            <circle
                                cx="11"
                                cy="11"
                                r="8"
                            />
                            <path d="m21 21-4.35-4.35" />
                        </svg>
                        <input
                            className="bg-transparent border-none outline-none text-sm text-(--color-text-primary) w-full"
                            placeholder={t("admin.searchUsers")}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-3">
                        <select
                            className={selectClass}
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                        >
                            <option value="all">{t("admin.all")}</option>
                            <option value="driver">{t("admin.driver")}</option>
                            <option value="passenger">
                                {t("admin.passenger")}
                            </option>
                        </select>
                        <select
                            className={selectClass}
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">{t("admin.all")}</option>
                            <option value="active">{t("admin.active")}</option>
                            <option value="banned">{t("admin.banned")}</option>
                            <option value="pending">
                                {t("admin.pending")}
                            </option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-(--color-card) rounded-2xl border border-(--color-border) overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-(--color-border)">
                                {[
                                    t("admin.user"),
                                    t("admin.role"),
                                    t("admin.email"),
                                    "SPZ",
                                    t("admin.rating"),
                                    t("admin.rides"),
                                    t("admin.status"),
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
                            {filtered.map((user) => (
                                <tr
                                    key={user.id}
                                    className="border-b border-(--color-border) last:border-0 hover:bg-(--color-bg) transition-colors"
                                >
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            <Avatar
                                                name={user.name}
                                                size="sm"
                                            />
                                            <span className="font-semibold text-(--color-text-primary) whitespace-nowrap">
                                                {user.name}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-(--color-text-secondary)">
                                        {t(`admin.${user.role}`)}
                                    </td>
                                    <td className="px-5 py-4 text-(--color-text-secondary)">
                                        {user.email}
                                    </td>
                                    <td className="px-5 py-4 text-(--color-text-secondary) font-mono text-xs">
                                        {user.spz ?? "-"}
                                    </td>
                                    <td className="px-5 py-4">
                                        <RatingDisplay rating={user.rating} />
                                    </td>
                                    <td className="px-5 py-4 font-semibold text-(--color-text-primary)">
                                        {user.rides}
                                    </td>
                                    <td className="px-5 py-4">
                                        <StatusBadge status={user.status} />
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex gap-2 items-center">
                                            <button
                                                onClick={() =>
                                                    setViewUser(user)
                                                }
                                                className="px-3 py-1.5 border border-(--color-border) rounded-lg text-sm font-medium text-(--color-text-secondary) hover:bg-(--color-border) transition-colors"
                                            >
                                                {t("admin.view")}
                                            </button>
                                            {user.status === "banned" ? (
                                                <button
                                                    onClick={() =>
                                                        handleUnban(user.id)
                                                    }
                                                    className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-semibold transition-colors"
                                                >
                                                    {t("admin.unban")}
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() =>
                                                        setBanUser(user)
                                                    }
                                                    className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-semibold transition-colors"
                                                >
                                                    {t("admin.ban")}
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

            {viewUser && (
                <UserProfileModal
                    user={viewUser}
                    onClose={() => setViewUser(null)}
                    onBan={() => {
                        setBanUser(viewUser);
                        setViewUser(null);
                    }}
                    onSave={(id, data) =>
                        setUsers((prev) =>
                            prev.map((u) =>
                                u.id === id ? { ...u, ...data } : u
                            )
                        )
                    }
                />
            )}

            {banUser && (
                <BanUserModal
                    user={banUser}
                    onClose={() => setBanUser(null)}
                    onConfirm={handleBan}
                />
            )}
        </div>
    );
}
