import { useTranslation } from "react-i18next";
import type { ReviewStatus } from "../../../../api-client/model/reviewStatus";

export const REVIEW_STATUS_BADGE_CLASSES: Record<ReviewStatus, string> = {
    VISIBLE: "border border-success-border bg-success-bg text-success-text",
    HIDDEN: "bg-warning-bg text-warning-text",
    REMOVED: "border border-danger-border bg-danger-bg text-danger-text",
};

export function useReviewStatusLabels(): Record<ReviewStatus, string> {
    const { t } = useTranslation();
    return {
        VISIBLE: t("admin.visible"),
        HIDDEN: t("admin.hidden"),
        REMOVED: t("admin.removed"),
    };
}
