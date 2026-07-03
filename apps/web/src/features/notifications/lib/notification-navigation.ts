import type { Notification } from "../../../api-client/model/notification";

export type NotificationTargetPath =
    | "/driver/requests"
    | "/driver/rides"
    | "/passenger/rides";

/**
 * Where clicking a notification should take the user. Driver-facing events
 * land on the driver pages; everything else concerns the user as a passenger.
 */
export function notificationTargetPath(
    notification: Notification
): NotificationTargetPath {
    switch (notification.notificationType) {
        case "BOOKING_REQUEST":
            return "/driver/requests";
        case "BOOKING_CANCELLED":
            // A passenger cancelling notifies the driver; a driver cancelling
            // notifies the passenger.
            return notification.payload?.cancelledBy === "PASSENGER"
                ? "/driver/rides"
                : "/passenger/rides";
        default:
            return "/passenger/rides";
    }
}
