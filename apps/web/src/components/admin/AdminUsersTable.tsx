import { useTranslation } from "react-i18next";
import { Avatar, Button } from "@waymate/ui";
import type { AdminUserListItem } from "../../api-client/model/adminUserListItem";
import { fullName, formatDate } from "../../lib/admin-format";
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
                                        <Button
                                            variant="secondary"
                                            onClick={() => onView(listItem)}
                                        >
                                            {t("admin.view")}
                                        </Button>
                                        {listItem.userStatus === "BANNED" ? (
                                            <Button
                                                variant="primary"
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
                                            >
                                                {t("admin.unban")}
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="red"
                                                onClick={() => onBan(listItem)}
                                                disabled={actionDisabled}
                                                title={
                                                    isSelf
                                                        ? t(
                                                              "admin.selfActionDisabled"
                                                          )
                                                        : undefined
                                                }
                                            >
                                                {t("admin.ban")}
                                            </Button>
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
