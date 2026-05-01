import { useTranslation } from "react-i18next";
import type { UserStatus } from "../../../api-client/model/userStatus";

export const STATUS_BADGE_CLASSES: Record<UserStatus, string> = {
    ACTIVE: "border border-(--color-success-border) bg-(--color-success-bg) text-(--color-success-text)",
    PENDING: "bg-(--color-warning-bg) text-(--color-warning-text)",
    SUSPENDED: "bg-(--color-warning-bg) text-(--color-warning-text)",
    BANNED: "border border-(--color-danger-border) bg-(--color-danger-bg) text-(--color-danger-text)",
    DELETED:
        "border border-(--color-border) bg-(--color-bg) text-(--color-text-secondary)",
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
