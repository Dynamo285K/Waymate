import { useTranslation } from "react-i18next";
import {
    Avatar,
    BanIcon,
    Button,
    CheckIcon,
    Modal,
} from "@waymate/ui";
import { useGetUsersAdminById } from "../../../../api-client/users/users";
import { getErrorI18nKey } from "../../../../lib/api-errors";
import { adminUsersErrorMap } from "../-lib/admin-errors";
import {
    fullName,
    formatDate,
} from "../../../../features/admin/lib/admin-format";
import {
    AdminModalActions,
    AdminModalBody,
    AdminModalHeader,
    adminActionButtonClass,
    adminLabelClass,
} from "../../-components/AdminModalLayout";
import { StatusBadge } from "./StatusBadge";
import { StatusHistoryEntry } from "./StatusHistoryEntry";

type UserDetailModalProps = {
    theme: "light" | "dark";
    userId: string;
    isSelf: boolean;
    isThisUserMutating: boolean;
    mutationErrorForThisUser: unknown;
    onClose: () => void;
    onRequestBan: () => void;
    onUnban: () => void;
};

export function UserDetailModal({
    theme,
    userId,
    isSelf,
    isThisUserMutating,
    mutationErrorForThisUser,
    onClose,
    onRequestBan,
    onUnban,
}: UserDetailModalProps) {
    const { t } = useTranslation();
    const detailQuery = useGetUsersAdminById(userId);

    const displayedName = detailQuery.data
        ? fullName(
              detailQuery.data.user.firstName,
              detailQuery.data.user.lastName
          ) || detailQuery.data.user.email
        : "";

    return (
        <Modal
            open={true}
            onClose={onClose}
            theme={theme}
        >
            <AdminModalBody>
                <AdminModalHeader
                    title={t("admin.userProfile")}
                    onClose={onClose}
                />

                {detailQuery.isLoading && (
                    <p className="text-text-secondary">
                        {t("admin.loadingUsers")}
                    </p>
                )}

                {!detailQuery.isLoading && detailQuery.isError && (
                    <p className="text-danger-text">
                        {t(
                            getErrorI18nKey(
                                detailQuery.error,
                                adminUsersErrorMap
                            )
                        )}
                    </p>
                )}

                {!detailQuery.isLoading && detailQuery.data && (
                    <>
                        <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center">
                            <Avatar
                                name={displayedName}
                                size="lg"
                            />
                            <div className="min-w-0">
                                <p className="text-lg font-bold text-text-primary">
                                    {fullName(
                                        detailQuery.data.user.firstName,
                                        detailQuery.data.user.lastName
                                    ) || "—"}
                                </p>
                                <p className="text-sm text-text-secondary mb-1 break-words">
                                    {detailQuery.data.user.email}
                                </p>
                                <StatusBadge
                                    status={detailQuery.data.user.userStatus}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-2 sm:gap-x-8">
                            <div>
                                <p className={adminLabelClass}>
                                    {t("admin.phone")}
                                </p>
                                <p className="text-sm font-semibold text-text-primary">
                                    {detailQuery.data.user.phone ?? "—"}
                                </p>
                            </div>
                            <div>
                                <p className={adminLabelClass}>
                                    {t("admin.displayName")}
                                </p>
                                <p className="text-sm font-semibold text-text-primary">
                                    {detailQuery.data.user.displayName ?? "—"}
                                </p>
                            </div>
                            <div>
                                <p className={adminLabelClass}>
                                    {t("admin.joined")}
                                </p>
                                <p className="text-sm font-semibold text-text-primary">
                                    {formatDate(
                                        detailQuery.data.user.createdAt,
                                        "—"
                                    )}
                                </p>
                            </div>
                            <div>
                                <p className={adminLabelClass}>
                                    {t("admin.lastActive")}
                                </p>
                                <p className="text-sm font-semibold text-text-primary">
                                    {formatDate(
                                        detailQuery.data.user.lastActiveAt,
                                        t("admin.never")
                                    )}
                                </p>
                            </div>
                            <div className="sm:col-span-2">
                                <p className={adminLabelClass}>
                                    {t("admin.bio")}
                                </p>
                                <p className="text-sm text-text-primary whitespace-pre-wrap break-words">
                                    {detailQuery.data.user.bio ?? "—"}
                                </p>
                            </div>
                        </div>

                        {mutationErrorForThisUser !== null &&
                            mutationErrorForThisUser !== undefined && (
                                <p className="text-sm text-danger-text mb-4">
                                    {t(
                                        getErrorI18nKey(
                                            mutationErrorForThisUser,
                                            adminUsersErrorMap
                                        )
                                    )}
                                </p>
                            )}

                        <div className="mb-6">
                            <AdminModalActions>
                                {detailQuery.data.user.userStatus ===
                                "BANNED" ? (
                                    <Button
                                        variant="primary"
                                        leftIcon={<CheckIcon />}
                                        className={adminActionButtonClass}
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
                                        leftIcon={<BanIcon />}
                                        className={adminActionButtonClass}
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
                            </AdminModalActions>
                        </div>

                        <h3 className="text-base font-bold text-text-primary mb-3">
                            {t("admin.statusHistory")}
                        </h3>
                        {detailQuery.data.statusHistory.length === 0 ? (
                            <p className="text-sm text-text-secondary">
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
            </AdminModalBody>
        </Modal>
    );
}
