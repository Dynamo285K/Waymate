import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AdminNavbar, Avatar, Button } from "@waymate/ui";
import type { Language } from "@waymate/ui";
import i18n from "../i18n";
import { useAdminNavbarProps } from "../hooks/useAdminNavbarProps";
import { useGetAdminUsers } from "../api-client/admin/admin";
import { useGetAdminUsersById } from "../api-client/admin/admin";
import { useSetUserRole } from "../hooks/useSetUserRole";
import { useSetUserStatus } from "../hooks/useSetUserStatus";
import type { AdminUserListItem } from "../api-client/model/adminUserListItem";
import type { AdminUserStatusHistoryItem } from "../api-client/model/adminUserStatusHistoryItem";
import type { UserRole } from "../api-client/model/userRole";
import type { UserStatus } from "../api-client/model/userStatus";

type AdminUsersPageProps = {
    language: Language;
    theme: "light" | "dark";
    onLanguageChange: (lang: Language) => void;
    onThemeToggle: () => void;
    userId?: string;
    userName?: string;
    userEmail?: string;
};

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;
const LOCALE_MAP: Record<string, string> = {
    en: "en-US",
    sk: "sk-SK",
    cs: "cs-CZ",
};

const STATUS_BADGE_CLASSES: Record<UserStatus, string> = {
    ACTIVE: "border border-(--color-success-border) bg-(--color-success-bg) text-(--color-success-text)",
    PENDING: "bg-(--color-warning-bg) text-(--color-warning-text)",
    SUSPENDED: "bg-(--color-warning-bg) text-(--color-warning-text)",
    BANNED: "border border-(--color-danger-border) bg-(--color-danger-bg) text-(--color-danger-text)",
    DELETED:
        "border border-(--color-border) bg-(--color-bg) text-(--color-text-secondary)",
};

function fullName(
    firstName: string | null | undefined,
    lastName: string | null | undefined
): string {
    return [firstName, lastName].filter(Boolean).join(" ");
}

function formatDate(
    value: string | null | undefined,
    fallback: string
): string {
    if (!value) return fallback;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return fallback;
    const locale = LOCALE_MAP[i18n.language] ?? "en-US";
    return new Intl.DateTimeFormat(locale, {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    }).format(date);
}

function StatusBadge({ status }: { status: UserStatus }) {
    const { t } = useTranslation();
    const labels: Record<UserStatus, string> = {
        ACTIVE: t("admin.active"),
        PENDING: t("admin.pending"),
        SUSPENDED: t("admin.suspended"),
        BANNED: t("admin.banned"),
        DELETED: t("admin.deleted"),
    };
    return (
        <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_BADGE_CLASSES[status]}`}
        >
            {labels[status]}
        </span>
    );
}

function useDebounced<T>(value: T, delayMs: number): T {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const id = window.setTimeout(() => setDebounced(value), delayMs);
        return () => window.clearTimeout(id);
    }, [value, delayMs]);
    return debounced;
}

function StatusHistoryEntry({ entry }: { entry: AdminUserStatusHistoryItem }) {
    const { t } = useTranslation();
    const labels: Record<UserStatus, string> = {
        ACTIVE: t("admin.active"),
        PENDING: t("admin.pending"),
        SUSPENDED: t("admin.suspended"),
        BANNED: t("admin.banned"),
        DELETED: t("admin.deleted"),
    };
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
        <li className="border border-(--color-border) rounded-xl p-3">
            <div className="flex justify-between items-start gap-3">
                <p className="text-sm font-semibold text-(--color-text-primary)">
                    {transition}
                </p>
                <p className="text-xs text-(--color-text-secondary) shrink-0">
                    {formatDate(entry.createdAt, "—")}
                </p>
            </div>
            <p className="text-xs text-(--color-text-secondary) mt-1">
                {t("admin.changedBy", { name: actorName })}
            </p>
            {entry.reason && (
                <p className="text-sm text-(--color-text-primary) mt-2 whitespace-pre-wrap">
                    {entry.reason}
                </p>
            )}
        </li>
    );
}

function UserDetailModal({
    userId,
    isSelf,
    onClose,
    onRequestBan,
    onUnban,
    onRoleChange,
    isMutating,
    mutationError,
}: {
    userId: string;
    isSelf: boolean;
    onClose: () => void;
    onRequestBan: () => void;
    onUnban: () => void;
    onRoleChange: (role: UserRole) => void;
    isMutating: boolean;
    mutationError: boolean;
}) {
    const { t } = useTranslation();
    const detailQuery = useGetAdminUsersById(userId);
    const labelClass =
        "text-xs font-bold text-(--color-text-secondary) tracking-wider mb-1 block";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            />
            <div
                className="relative rounded-2xl shadow-2xl w-full max-w-2xl p-8 max-h-[90vh] overflow-y-auto"
                style={{ background: "var(--color-card)" }}
            >
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-(--color-text-primary)">
                        {t("admin.userProfile")}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-(--color-text-secondary) hover:text-(--color-text-primary) text-xl"
                    >
                        ✕
                    </button>
                </div>

                {detailQuery.isLoading && (
                    <p className="text-(--color-text-secondary)">
                        {t("admin.loadingUsers")}
                    </p>
                )}

                {detailQuery.isError && (
                    <p className="text-(--color-danger-text)">
                        {t("admin.loadError")}
                    </p>
                )}

                {detailQuery.data && (
                    <>
                        <div className="flex items-center gap-4 mb-6">
                            <Avatar
                                name={
                                    fullName(
                                        detailQuery.data.user.firstName,
                                        detailQuery.data.user.lastName
                                    ) || detailQuery.data.user.email
                                }
                                size="lg"
                            />
                            <div>
                                <p className="text-lg font-bold text-(--color-text-primary)">
                                    {fullName(
                                        detailQuery.data.user.firstName,
                                        detailQuery.data.user.lastName
                                    ) || "—"}
                                </p>
                                <p className="text-sm text-(--color-text-secondary) mb-1">
                                    {detailQuery.data.user.email}
                                </p>
                                <StatusBadge
                                    status={detailQuery.data.user.userStatus}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-6">
                            <div>
                                <p className={labelClass}>{t("admin.phone")}</p>
                                <p className="text-sm font-semibold text-(--color-text-primary)">
                                    {detailQuery.data.user.phone ?? "—"}
                                </p>
                            </div>
                            <div>
                                <p className={labelClass}>
                                    {t("admin.displayName")}
                                </p>
                                <p className="text-sm font-semibold text-(--color-text-primary)">
                                    {detailQuery.data.user.displayName ?? "—"}
                                </p>
                            </div>
                            <div>
                                <p className={labelClass}>
                                    {t("admin.joined")}
                                </p>
                                <p className="text-sm font-semibold text-(--color-text-primary)">
                                    {formatDate(
                                        detailQuery.data.user.createdAt,
                                        "—"
                                    )}
                                </p>
                            </div>
                            <div>
                                <p className={labelClass}>
                                    {t("admin.lastActive")}
                                </p>
                                <p className="text-sm font-semibold text-(--color-text-primary)">
                                    {formatDate(
                                        detailQuery.data.user.lastActiveAt,
                                        t("admin.never")
                                    )}
                                </p>
                            </div>
                            <div className="col-span-2">
                                <p className={labelClass}>{t("admin.bio")}</p>
                                <p className="text-sm text-(--color-text-primary) whitespace-pre-wrap">
                                    {detailQuery.data.user.bio ?? "—"}
                                </p>
                            </div>
                            <div>
                                <p className={labelClass}>{t("admin.role")}</p>
                                <select
                                    className="w-full border border-(--color-border) rounded-xl bg-(--color-input-bg) text-(--color-text-primary) px-3 py-2.5 text-sm outline-none focus:border-(--color-primary) transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    value={detailQuery.data.user.role}
                                    disabled={isSelf || isMutating}
                                    title={
                                        isSelf
                                            ? t("admin.selfActionDisabled")
                                            : undefined
                                    }
                                    onChange={(e) =>
                                        onRoleChange(e.target.value as UserRole)
                                    }
                                >
                                    <option value="USER">
                                        {t("admin.userRoleUser")}
                                    </option>
                                    <option value="ADMIN">
                                        {t("admin.userRoleAdmin")}
                                    </option>
                                </select>
                            </div>
                        </div>

                        {mutationError && (
                            <p className="text-sm text-(--color-danger-text) mb-4">
                                {t("admin.failedToUpdate")}
                            </p>
                        )}

                        <div className="flex gap-2 flex-wrap mb-6">
                            {detailQuery.data.user.userStatus === "BANNED" ? (
                                <Button
                                    variant="primary"
                                    onClick={onUnban}
                                    disabled={isSelf || isMutating}
                                    title={
                                        isSelf
                                            ? t("admin.selfActionDisabled")
                                            : undefined
                                    }
                                >
                                    {t("admin.unbanUser")}
                                </Button>
                            ) : (
                                <Button
                                    variant="red"
                                    onClick={onRequestBan}
                                    disabled={isSelf || isMutating}
                                    title={
                                        isSelf
                                            ? t("admin.selfActionDisabled")
                                            : undefined
                                    }
                                >
                                    {t("admin.banUser")}
                                </Button>
                            )}
                        </div>

                        <h3 className="text-base font-bold text-(--color-text-primary) mb-3">
                            {t("admin.statusHistory")}
                        </h3>
                        {detailQuery.data.statusHistory.length === 0 ? (
                            <p className="text-sm text-(--color-text-secondary)">
                                {t("admin.noStatusHistory")}
                            </p>
                        ) : (
                            <ul className="flex flex-col gap-2">
                                {detailQuery.data.statusHistory.map((entry) => (
                                    <StatusHistoryEntry
                                        key={entry.id}
                                        entry={entry}
                                    />
                                ))}
                            </ul>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

function BanUserModal({
    userName,
    onClose,
    onConfirm,
    isPending,
    isError,
}: {
    userName: string;
    onClose: () => void;
    onConfirm: (reason: string | undefined) => void;
    isPending: boolean;
    isError: boolean;
}) {
    const { t } = useTranslation();
    const [reason, setReason] = useState("");
    const trimmedReason = reason.trim();

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
                        {t("admin.banUser")} — {userName}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-(--color-text-secondary) hover:text-(--color-text-primary) text-xl"
                    >
                        ✕
                    </button>
                </div>

                <div className="bg-(--color-danger-bg) border border-(--color-danger-border) rounded-xl p-4 mb-5 text-sm text-(--color-danger-text)">
                    {t("admin.banWarning")}
                </div>

                <div className="mb-6">
                    <label className="text-sm font-semibold text-(--color-text-primary) mb-1.5 block">
                        {t("admin.reasonForBan")}
                    </label>
                    <textarea
                        className={inputClass + " resize-y min-h-25"}
                        placeholder={t("admin.reasonPlaceholder")}
                        maxLength={500}
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                    />
                </div>

                {isError && (
                    <p className="text-sm text-(--color-danger-text) mb-4">
                        {t("admin.failedToUpdate")}
                    </p>
                )}

                <div className="flex gap-3 justify-end">
                    <Button
                        variant="secondary"
                        onClick={onClose}
                        disabled={isPending}
                    >
                        {t("admin.cancel")}
                    </Button>
                    <Button
                        variant="red"
                        onClick={() =>
                            onConfirm(
                                trimmedReason.length > 0
                                    ? trimmedReason
                                    : undefined
                            )
                        }
                        disabled={isPending}
                    >
                        ⊘ {t("admin.confirmBan")}
                    </Button>
                </div>
            </div>
        </div>
    );
}

export function AdminUsersPage({
    language,
    theme,
    onLanguageChange,
    onThemeToggle,
    userId,
    userName = "Admin",
    userEmail = "admin@waymate.com",
}: AdminUsersPageProps) {
    const { t } = useTranslation();
    const navbarProps = useAdminNavbarProps({
        activeTab: "users",
        language,
        onLanguageChange,
        theme,
        onThemeToggle,
        userName,
        userEmail,
    });

    const [searchInput, setSearchInput] = useState("");
    const debouncedSearch = useDebounced(searchInput, SEARCH_DEBOUNCE_MS);
    const [roleFilter, setRoleFilter] = useState<UserRole | "ALL">("ALL");

    const [previousPages, setPreviousPages] = useState<AdminUserListItem[][]>(
        []
    );
    const [cursor, setCursor] = useState<string | undefined>(undefined);

    const trimmedSearch = debouncedSearch.trim();
    const queryParams = {
        limit: PAGE_SIZE,
        cursor,
        role: roleFilter === "ALL" ? undefined : roleFilter,
        search: trimmedSearch.length > 0 ? trimmedSearch : undefined,
    };

    const usersQuery = useGetAdminUsers(queryParams);

    // Reset accumulated pages when filters change. We can't compare params via
    // identity, so we serialize the filter portion of the query key.
    const filterKey = useMemo(
        () => `${roleFilter}|${trimmedSearch}`,
        [roleFilter, trimmedSearch]
    );
    useEffect(() => {
        setPreviousPages([]);
        setCursor(undefined);
    }, [filterKey]);

    const items = useMemo(
        () => [...previousPages.flat(), ...(usersQuery.data?.items ?? [])],
        [previousPages, usersQuery.data]
    );

    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [banTarget, setBanTarget] = useState<AdminUserListItem | null>(null);

    const setUserRole = useSetUserRole();
    const setUserStatus = useSetUserStatus();

    // Drop accumulated prior pages so the invalidated refetch starts from page 1
    // and reflects the mutation across the whole loaded range.
    const resetPagination = () => {
        setPreviousPages([]);
        setCursor(undefined);
    };

    const handleLoadMore = () => {
        const data = usersQuery.data;
        if (!data || !data.nextCursor) return;
        setPreviousPages((prev) => [...prev, data.items]);
        setCursor(data.nextCursor);
    };

    const handleRoleChange = (targetUserId: string, role: UserRole) => {
        if (targetUserId === userId) return;
        setUserRole.mutate(
            { userId: targetUserId, role },
            { onSuccess: resetPagination }
        );
    };

    const handleConfirmBan = (reason: string | undefined) => {
        if (!banTarget) return;
        setUserStatus.mutate(
            { userId: banTarget.id, status: "BANNED", reason },
            {
                onSuccess: () => {
                    setBanTarget(null);
                    resetPagination();
                },
            }
        );
    };

    const handleUnban = (target: AdminUserListItem) => {
        setUserStatus.mutate(
            { userId: target.id, status: "ACTIVE" },
            { onSuccess: resetPagination }
        );
    };

    const selectClass =
        "border border-(--color-border) rounded-lg bg-(--color-card) text-(--color-text-primary) text-sm px-3 py-2 outline-none cursor-pointer";

    const isInitialLoading =
        usersQuery.isLoading || (cursor === undefined && usersQuery.isFetching);

    return (
        <div
            data-theme={theme}
            className="min-h-screen bg-(--color-bg)"
        >
            <AdminNavbar {...navbarProps} />

            <div className="w-full px-4 sm:max-w-6xl sm:mx-auto sm:px-8 py-8">
                <h1 className="text-2xl font-bold text-(--color-text-primary)">
                    {t("admin.usersTitle")}
                </h1>
                <p className="text-(--color-text-secondary) text-sm mt-1 mb-6">
                    {t("admin.usersSubtitle")}
                </p>

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
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-3">
                        <select
                            className={selectClass}
                            value={roleFilter}
                            onChange={(e) =>
                                setRoleFilter(
                                    e.target.value as UserRole | "ALL"
                                )
                            }
                        >
                            <option value="ALL">{t("admin.all")}</option>
                            <option value="USER">
                                {t("admin.userRoleUser")}
                            </option>
                            <option value="ADMIN">
                                {t("admin.userRoleAdmin")}
                            </option>
                        </select>
                    </div>
                </div>

                {isInitialLoading && (
                    <p className="text-(--color-text-secondary) py-4">
                        {t("admin.loadingUsers")}
                    </p>
                )}

                {!isInitialLoading && usersQuery.isError && (
                    <p className="text-(--color-danger-text) py-4">
                        {t("admin.loadError")}
                    </p>
                )}

                {!isInitialLoading &&
                    !usersQuery.isError &&
                    items.length === 0 && (
                        <p className="text-(--color-text-secondary) py-4">
                            {t("admin.noUsersFound")}
                        </p>
                    )}

                {!isInitialLoading &&
                    !usersQuery.isError &&
                    items.length > 0 && (
                        <>
                            <div className="bg-(--color-card) rounded-2xl border border-(--color-border) overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-(--color-border)">
                                            {[
                                                t("admin.user"),
                                                t("admin.role"),
                                                t("admin.email"),
                                                t("admin.status"),
                                                t("admin.lastActive"),
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
                                        {items.map((listItem) => {
                                            const name =
                                                fullName(
                                                    listItem.firstName,
                                                    listItem.lastName
                                                ) || listItem.email;
                                            const isSelf =
                                                listItem.id === userId;
                                            return (
                                                <tr
                                                    key={listItem.id}
                                                    className="border-b border-(--color-border) last:border-0 hover:bg-(--color-bg) transition-colors"
                                                >
                                                    <td className="px-5 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <Avatar
                                                                name={name}
                                                                size="sm"
                                                            />
                                                            <span className="font-semibold text-(--color-text-primary) whitespace-nowrap">
                                                                {name}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4 text-(--color-text-secondary)">
                                                        {listItem.role ===
                                                        "ADMIN"
                                                            ? t(
                                                                  "admin.userRoleAdmin"
                                                              )
                                                            : t(
                                                                  "admin.userRoleUser"
                                                              )}
                                                    </td>
                                                    <td className="px-5 py-4 text-(--color-text-secondary)">
                                                        {listItem.email}
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <StatusBadge
                                                            status={
                                                                listItem.userStatus
                                                            }
                                                        />
                                                    </td>
                                                    <td className="px-5 py-4 text-(--color-text-secondary)">
                                                        {formatDate(
                                                            listItem.lastActiveAt,
                                                            t("admin.never")
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <div className="flex gap-2 items-center">
                                                            <button
                                                                onClick={() =>
                                                                    setSelectedUserId(
                                                                        listItem.id
                                                                    )
                                                                }
                                                                className="px-3 py-1.5 border border-(--color-border) rounded-lg text-sm font-medium text-(--color-text-secondary) hover:bg-(--color-border) transition-colors"
                                                            >
                                                                {t(
                                                                    "admin.view"
                                                                )}
                                                            </button>
                                                            {listItem.userStatus ===
                                                            "BANNED" ? (
                                                                <button
                                                                    onClick={() =>
                                                                        handleUnban(
                                                                            listItem
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        isSelf ||
                                                                        setUserStatus.isPending
                                                                    }
                                                                    title={
                                                                        isSelf
                                                                            ? t(
                                                                                  "admin.selfActionDisabled"
                                                                              )
                                                                            : undefined
                                                                    }
                                                                    className="px-3 py-1.5 bg-(--color-primary) hover:bg-(--color-primary-hover) text-(--color-card) rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                                >
                                                                    {t(
                                                                        "admin.unban"
                                                                    )}
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    onClick={() =>
                                                                        setBanTarget(
                                                                            listItem
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        isSelf ||
                                                                        setUserStatus.isPending
                                                                    }
                                                                    title={
                                                                        isSelf
                                                                            ? t(
                                                                                  "admin.selfActionDisabled"
                                                                              )
                                                                            : undefined
                                                                    }
                                                                    className="px-3 py-1.5 bg-(--color-red) hover:bg-(--color-red)/90 text-(--color-card) rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                                >
                                                                    {t(
                                                                        "admin.ban"
                                                                    )}
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {usersQuery.data?.nextCursor && (
                                <div className="flex justify-center mt-6">
                                    <Button
                                        variant="secondary"
                                        onClick={handleLoadMore}
                                        disabled={usersQuery.isFetching}
                                    >
                                        {t("admin.loadMore")}
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
            </div>

            {selectedUserId && (
                <UserDetailModal
                    userId={selectedUserId}
                    isSelf={selectedUserId === userId}
                    onClose={() => setSelectedUserId(null)}
                    onRequestBan={() => {
                        const target = items.find(
                            (u) => u.id === selectedUserId
                        );
                        if (target) {
                            setSelectedUserId(null);
                            setBanTarget(target);
                        }
                    }}
                    onUnban={() => {
                        const target = items.find(
                            (u) => u.id === selectedUserId
                        );
                        if (target) handleUnban(target);
                    }}
                    onRoleChange={(role) =>
                        handleRoleChange(selectedUserId, role)
                    }
                    isMutating={
                        setUserRole.isPending || setUserStatus.isPending
                    }
                    mutationError={setUserRole.isError || setUserStatus.isError}
                />
            )}

            {banTarget && (
                <BanUserModal
                    userName={
                        fullName(banTarget.firstName, banTarget.lastName) ||
                        banTarget.email
                    }
                    onClose={() => setBanTarget(null)}
                    onConfirm={handleConfirmBan}
                    isPending={setUserStatus.isPending}
                    isError={setUserStatus.isError}
                />
            )}
        </div>
    );
}
