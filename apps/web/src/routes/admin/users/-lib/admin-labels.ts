import { useTranslation } from "react-i18next";
import type { UserStatus } from "../../../../api-client/model/userStatus";

export const STATUS_BADGE_CLASSES: Record<UserStatus, string> = {
    ACTIVE: "border border-success-border bg-success-bg text-success-text",
    PENDING: "bg-warning-bg text-warning-text",
    SUSPENDED: "bg-warning-bg text-warning-text",
    BANNED: "border border-danger-border bg-danger-bg text-danger-text",
    DELETED: "border border-border bg-background text-text-secondary",
};

export function useStatusLabels(): Record<UserStatus, string> {
    const { t } = useTranslation();
    return {
        ACTIVE: t("admin.active"),
        PENDING: t("admin.pending"),
        SUSPENDED: t("admin.suspended"),
        BANNED: t("admin.banned"),
        DELETED: t("admin.deleted"),
    };
}
