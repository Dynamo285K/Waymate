import { useTranslation } from "react-i18next";
import type { RideStatus } from "../../../../api-client/model/rideStatus";

export const RIDE_STATUS_BADGE_CLASSES: Record<RideStatus, string> = {
    PLANNED: "border border-border bg-card text-text-primary",
    IN_PROGRESS: "border border-success-border bg-success-bg text-success-text",
    COMPLETED: "border border-border bg-background text-text-secondary",
    CANCELLED: "border border-danger-border bg-danger-bg text-danger-text",
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
