import type { TFunction } from "i18next";
import type { Notification } from "../../../api-client/model/notification";

// Types the frontend knows how to localize. Anything else (e.g. future enum
// values shipped by a newer API) falls back to the English title/body stored
// on the notification row.
const LOCALIZED_TYPES = new Set([
    "BOOKING_REQUEST",
    "BOOKING_CONFIRMED",
    "BOOKING_REJECTED",
    "BOOKING_CANCELLED",
    "RIDE_CANCELLED",
    "RIDE_COMPLETED",
]);

/**
 * Builds the localized title/body for a notification from its type + payload,
 * mirroring the English fallback the API stores in `title`/`body`.
 */
export function localizeNotification(
    t: TFunction,
    notification: Notification
): { title: string; body: string } {
    const { notificationType, payload } = notification;

    if (!LOCALIZED_TYPES.has(notificationType)) {
        return { title: notification.title, body: notification.body };
    }

    const route =
        payload?.originCity && payload?.destinationCity
            ? `${payload.originCity} → ${payload.destinationCity}`
            : t("notifications.yourRide");
    const values = {
        route,
        actorName: payload?.actorName ?? t("notifications.someone"),
        seatCount: payload?.seatCount ?? 1,
    };

    if (notificationType === "BOOKING_CANCELLED") {
        const side =
            payload?.cancelledBy === "PASSENGER" ? "byPassenger" : "byDriver";
        return {
            title: t(
                `notifications.types.BOOKING_CANCELLED.${side}.title`,
                values
            ),
            body: t(
                `notifications.types.BOOKING_CANCELLED.${side}.body`,
                values
            ),
        };
    }

    return {
        title: t(`notifications.types.${notificationType}.title`, values),
        body: t(`notifications.types.${notificationType}.body`, values),
    };
}
