import { useTranslation } from "react-i18next";
import { Avatar } from "@waymate/ui";
import type { AdminUserListItem } from "../../../api-client/model/adminUserListItem";
import { fullName, formatDate } from "../lib/format";
import { StatusBadge } from "./StatusBadge";

type AdminUsersTableProps = {
    items: AdminUserListItem[];
    currentUserId: string | undefined;
    rowMutatingId: string | null;
    onView: (user: AdminUserListItem) => void;
    onBan: (user: AdminUserListItem) => void;
    onUnban: (user: AdminUserListItem) => void;
};

export function AdminUsersTable({
    items,
    currentUserId,
    rowMutatingId,
    onView,
    onBan,
    onUnban,
}: AdminUsersTableProps) {
    const { t } = useTranslation();

    return (
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
                            fullName(listItem.firstName, listItem.lastName) ||
                            listItem.email;
                        const isSelf = listItem.id === currentUserId;
                        const isThisRowMutating = rowMutatingId === listItem.id;
                        const actionDisabled = isSelf || isThisRowMutating;
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
                                    {listItem.userRole === "ADMIN"
                                        ? t("admin.userRoleAdmin")
                                        : t("admin.userRoleUser")}
                                </td>
                                <td className="px-5 py-4 text-(--color-text-secondary)">
                                    {listItem.email}
                                </td>
                                <td className="px-5 py-4">
                                    <StatusBadge status={listItem.userStatus} />
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
                                            onClick={() => onView(listItem)}
                                            className="px-3 py-1.5 border border-(--color-border) rounded-lg text-sm font-medium text-(--color-text-secondary) hover:bg-(--color-border) transition-colors"
                                        >
                                            {t("admin.view")}
                                        </button>
                                        {listItem.userStatus === "BANNED" ? (
                                            <button
                                                onClick={() =>
                                                    onUnban(listItem)
                                                }
                                                disabled={actionDisabled}
                                                title={
                                                    isSelf
                                                        ? t(
                                                              "admin.selfActionDisabled"
                                                          )
                                                        : undefined
                                                }
                                                className="px-3 py-1.5 bg-(--color-primary) hover:bg-(--color-primary-hover) text-(--color-card) rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {t("admin.unban")}
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => onBan(listItem)}
                                                disabled={actionDisabled}
                                                title={
                                                    isSelf
                                                        ? t(
                                                              "admin.selfActionDisabled"
                                                          )
                                                        : undefined
                                                }
                                                className="px-3 py-1.5 bg-(--color-red) hover:bg-(--color-red)/90 text-(--color-card) rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {t("admin.ban")}
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
    );
}
