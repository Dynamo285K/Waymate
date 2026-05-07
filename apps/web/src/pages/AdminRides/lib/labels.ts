import { useTranslation } from "react-i18next";
import type { RideStatus } from "../../../api-client/model/rideStatus";

export const RIDE_STATUS_BADGE_CLASSES: Record<RideStatus, string> = {
    PLANNED:
        "border border-(--color-border) bg-(--color-card) text-(--color-text-primary)",
    IN_PROGRESS:
        "border border-(--color-success-border) bg-(--color-success-bg) text-(--color-success-text)",
    COMPLETED:
        "border border-(--color-border) bg-(--color-bg) text-(--color-text-secondary)",
    CANCELLED:
        "border border-(--color-danger-border) bg-(--color-danger-bg) text-(--color-danger-text)",
};

export function useRideStatusLabels(): Record<RideStatus, string> {
    const { t } = useTranslation();
    return {
        PLANNED: t("admin.planned"),
        IN_PROGRESS: t("admin.inProgress"),
        COMPLETED: t("admin.completed"),
        CANCELLED: t("admin.cancelled"),
    };
}
