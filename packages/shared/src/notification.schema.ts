import { z } from "zod";
import { notificationTypeValues } from "./status-values";

// Structured params stored in the `payload` jsonb column. The frontend builds
// localized notification text from `notificationType` + these fields; the
// stored `title`/`body` columns are an English fallback for unknown types.
export const NotificationPayloadSchema = z.object({
    rideId: z.uuid().optional(),
    bookingId: z.uuid().optional(),
    originCity: z.string().optional(),
    destinationCity: z.string().optional(),
    // ISO string, not a Date — the value lives in jsonb.
    departureAt: z.iso.datetime().optional(),
    actorName: z.string().optional(),
    seatCount: z.number().int().optional(),
    // Disambiguates BOOKING_CANCELLED wording for the recipient.
    cancelledBy: z.enum(["DRIVER", "PASSENGER"]).optional(),
});

export const NotificationSchema = z.object({
    id: z.uuid(),
    notificationType: z.enum(notificationTypeValues),
    referenceEntityType: z.string().nullable(),
    referenceEntityId: z.uuid().nullable(),
    title: z.string(),
    body: z.string(),
    payload: NotificationPayloadSchema.nullable(),
    readAt: z.date().nullable(),
    createdAt: z.date(),
});

export const NotificationListSchema = NotificationSchema.array();

export const NotificationIdParamsSchema = z.object({
    id: z.uuid("Invalid notification ID"),
});

export const NotificationsQuerySchema = z.object({
    limit: z.coerce.number().int().min(1).max(100).default(20),
    before: z.coerce.date().optional(),
    beforeId: z.uuid().optional(),
});

export const UnreadCountResponseSchema = z.object({
    count: z.number().int(),
});

export const NotificationReadResponseSchema = z.object({
    id: z.uuid(),
    readAt: z.date(),
});

export const NotificationsReadAllResponseSchema = z.object({
    updated: z.number().int(),
});

// Pushed over the chat WebSocket (`GET /conversations/ws`) as part of
// ChatSocketEventSchema — the per-user topic doubles as the delivery channel
// for in-app notifications.
export const NotificationEventSchema = z.object({
    type: z.literal("notification"),
    notification: NotificationSchema,
});

export type NotificationType = (typeof notificationTypeValues)[number];
export type NotificationPayload = z.infer<typeof NotificationPayloadSchema>;
export type Notification = z.infer<typeof NotificationSchema>;
export type NotificationEvent = z.infer<typeof NotificationEventSchema>;
