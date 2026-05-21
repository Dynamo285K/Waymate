import { useTranslation } from "react-i18next";
import type { ReviewStatus } from "../api-client/model/reviewStatus";

export const REVIEW_STATUS_BADGE_CLASSES: Record<ReviewStatus, string> = {
    VISIBLE:
        "border border-(--color-success-border) bg-(--color-success-bg) text-(--color-success-text)",
    HIDDEN: "bg-(--color-warning-bg) text-(--color-warning-text)",
    REMOVED:
        "border border-(--color-danger-border) bg-(--color-danger-bg) text-(--color-danger-text)",
};

export function useReviewStatusLabels(): Record<ReviewStatus, string> {
    const { t } = useTranslation();
    return {
        VISIBLE: t("admin.visible"),
        HIDDEN: t("admin.hidden"),
        REMOVED: t("admin.removed"),
    };
}
