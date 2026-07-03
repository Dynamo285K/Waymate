import type { NotificationPayload, NotificationType } from "@repo/shared";

// English fallback text stored in the notNull title/body columns. The web
// client renders localized text from notificationType + payload and only
// falls back to these strings for types it does not recognize.

const routeLabel = (payload: NotificationPayload): string => {
    if (payload.originCity && payload.destinationCity) {
        return `${payload.originCity} → ${payload.destinationCity}`;
    }
    return "your ride";
};

export const buildNotificationContent = (
    type: NotificationType,
    payload: NotificationPayload
): { title: string; body: string } => {
    const route = routeLabel(payload);
    const actor = payload.actorName ?? "A user";

    switch (type) {
        case "BOOKING_REQUEST": {
            const seats =
                payload.seatCount === 1
                    ? "1 seat"
                    : `${payload.seatCount ?? "some"} seats`;
            return {
                title: "New booking request",
                body: `${actor} requested ${seats} on ${route}`,
            };
        }
        case "BOOKING_CONFIRMED":
            return {
                title: "Booking confirmed",
                body: `Your booking on ${route} was confirmed`,
            };
        case "BOOKING_REJECTED":
            return {
                title: "Booking rejected",
                body: `Your booking on ${route} was rejected`,
            };
        case "BOOKING_CANCELLED":
            return payload.cancelledBy === "PASSENGER"
                ? {
                      title: "Booking cancelled",
                      body: `${actor} cancelled their booking on ${route}`,
                  }
                : {
                      title: "Booking cancelled",
                      body: `Your booking on ${route} was cancelled by the driver`,
                  };
        case "RIDE_CANCELLED":
            return {
                title: "Ride cancelled",
                body: `The ride ${route} was cancelled`,
            };
        case "RIDE_COMPLETED":
            return {
                title: "Ride completed",
                body: `The ride ${route} is complete — you can now rate the driver`,
            };
        // Not produced by the API today; kept exhaustive for the enum.
        case "MESSAGE_RECEIVED":
            return {
                title: "New message",
                body: `${actor} sent you a message`,
            };
        case "RIDE_UPDATED":
            return {
                title: "Ride updated",
                body: `The ride ${route} was updated`,
            };
        case "REVIEW_RECEIVED":
            return { title: "New review", body: `${actor} left you a review` };
    }
};
