import type { InferSelectModel } from "drizzle-orm";
import type { notifications } from "../../db/schema/notification";
import type {
    Notification,
    NotificationPayload,
    NotificationType,
} from "@repo/shared";

export type NotificationRow = InferSelectModel<typeof notifications>;

export type NotificationReferenceEntityType = "BOOKING" | "RIDE";

export type CreateNotificationInput = {
    userId: string;
    type: NotificationType;
    referenceEntityType: NotificationReferenceEntityType;
    referenceEntityId: string;
    payload: NotificationPayload;
};

// A created notification together with its recipient — the service returns
// pairs so callers can publish to the right user topic after their
// transaction commits (the DTO itself never exposes userId).
export type CreatedNotification = {
    userId: string;
    notification: Notification;
};

// Origin/destination + departure of a ride, used to build notification text.
export type RideSummary = {
    originCity: string;
    destinationCity: string;
    departureAt: Date;
};

export const toNotificationDto = (row: NotificationRow): Notification => ({
    id: row.id,
    notificationType: row.notificationType,
    referenceEntityType: row.referenceEntityType,
    referenceEntityId: row.referenceEntityId,
    title: row.title,
    body: row.body,
    payload: row.payload ?? null,
    readAt: row.readAt,
    createdAt: row.createdAt,
});
