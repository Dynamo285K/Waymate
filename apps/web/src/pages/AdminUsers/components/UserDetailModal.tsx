import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Avatar, Button } from "@waymate/ui";
import { useGetAdminUsersById } from "../../../api-client/admin/admin";
import type { UserRole } from "../../../api-client/model/userRole";
import { getErrorI18nKey } from "../../../lib/api-errors";
import { adminUsersErrorMap } from "../lib/errors";
import { fullName, formatDate } from "../lib/format";
import { StatusBadge } from "./StatusBadge";
import { StatusHistoryEntry } from "./StatusHistoryEntry";

type UserDetailModalProps = {
    userId: string;
    isSelf: boolean;
    isThisUserMutating: boolean;
    mutationErrorForThisUser: unknown;
    onClose: () => void;
    onRequestBan: () => void;
    onUnban: () => void;
    onRoleChange: (role: UserRole) => void;
};

export function UserDetailModal({
    userId,
    isSelf,
    isThisUserMutating,
    mutationErrorForThisUser,
    onClose,
    onRequestBan,
    onUnban,
    onRoleChange,
}: UserDetailModalProps) {
    const { t } = useTranslation();
    const detailQuery = useGetAdminUsersById(userId);

    const [pendingRole, setPendingRole] = useState<UserRole | null>(null);

    const labelClass =
        "text-xs font-bold text-(--color-text-secondary) tracking-wider mb-1 block";

    const displayedName = detailQuery.data
        ? fullName(
              detailQuery.data.user.firstName,
              detailQuery.data.user.lastName
          ) || detailQuery.data.user.email
        : "";

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

                {!detailQuery.isLoading && detailQuery.isError && (
                    <p className="text-(--color-danger-text)">
                        {t("admin.loadError")}
                    </p>
                )}

                {!detailQuery.isLoading && detailQuery.data && (
                    <>
                        <div className="flex items-center gap-4 mb-6">
                            <Avatar
                                name={displayedName}
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
                                <p className="text-sm font-semibold text-(--color-text-primary)">
                                    {detailQuery.data.user.role === "ADMIN"
                                        ? t("admin.userRoleAdmin")
                                        : t("admin.userRoleUser")}
                                </p>
                            </div>
                        </div>

                        {mutationErrorForThisUser !== null &&
                            mutationErrorForThisUser !== undefined && (
                                <p className="text-sm text-(--color-danger-text) mb-4">
                                    {t(
                                        getErrorI18nKey(
                                            mutationErrorForThisUser,
                                            adminUsersErrorMap
                                        )
                                    )}
                                </p>
                            )}

                        <div className="flex gap-2 flex-wrap mb-6">
                            {detailQuery.data.user.role === "USER" ? (
                                <Button
                                    variant="secondary"
                                    onClick={() => setPendingRole("ADMIN")}
                                    disabled={isSelf || isThisUserMutating}
                                    title={
                                        isSelf
                                            ? t("admin.selfActionDisabled")
                                            : undefined
                                    }
                                >
                                    {t("admin.promoteToAdmin")}
                                </Button>
                            ) : (
                                <Button
                                    variant="secondary"
                                    onClick={() => setPendingRole("USER")}
                                    disabled={isSelf || isThisUserMutating}
                                    title={
                                        isSelf
                                            ? t("admin.selfActionDisabled")
                                            : undefined
                                    }
                                >
                                    {t("admin.demoteToUser")}
                                </Button>
                            )}
                            {detailQuery.data.user.userStatus === "BANNED" ? (
                                <Button
                                    variant="primary"
                                    onClick={onUnban}
                                    disabled={isSelf || isThisUserMutating}
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
                                    disabled={isSelf || isThisUserMutating}
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

            {pendingRole && detailQuery.data && (
                <RoleChangeConfirmModal
                    targetName={displayedName}
                    nextRole={pendingRole}
                    isPending={isThisUserMutating}
                    onCancel={() => setPendingRole(null)}
                    onConfirm={() => {
                        const role = pendingRole;
                        setPendingRole(null);
                        onRoleChange(role);
                    }}
                />
            )}
        </div>
    );
}

function RoleChangeConfirmModal({
    targetName,
    nextRole,
    isPending,
    onCancel,
    onConfirm,
}: {
    targetName: string;
    nextRole: UserRole;
    isPending: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}) {
    const { t } = useTranslation();
    const isPromote = nextRole === "ADMIN";
    const title = isPromote
        ? t("admin.promoteConfirmTitle", { name: targetName })
        : t("admin.demoteConfirmTitle", { name: targetName });
    const body = isPromote
        ? t("admin.promoteConfirmBody")
        : t("admin.demoteConfirmBody");

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onCancel}
            />
            <div
                className="relative rounded-2xl shadow-2xl w-full max-w-md p-6"
                style={{ background: "var(--color-card)" }}
            >
                <h3 className="text-lg font-bold text-(--color-text-primary) mb-3">
                    {title}
                </h3>
                <p className="text-sm text-(--color-text-secondary) mb-6">
                    {body}
                </p>
                <div className="flex gap-3 justify-end">
                    <Button
                        variant="secondary"
                        onClick={onCancel}
                        disabled={isPending}
                    >
                        {t("admin.cancel")}
                    </Button>
                    <Button
                        variant="primary"
                        onClick={onConfirm}
                        disabled={isPending}
                    >
                        {t("admin.confirmRoleChange")}
                    </Button>
                </div>
            </div>
        </div>
    );
}
