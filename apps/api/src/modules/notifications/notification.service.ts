import { db } from "../../db";
import type { Executor } from "../../db";
import { ChatRealtime } from "../chat/chat.realtime";
import { buildNotificationContent } from "./notification.content";
import { NotificationRepository } from "./notification.repository";
import {
    NotificationError,
    NotificationErrorCodes,
} from "./notification.errors";
import {
    toNotificationDto,
    type CreateNotificationInput,
    type CreatedNotification,
} from "./notification.types";
import type { Notification, NotificationPayload } from "@repo/shared";

// Create a notification row. Called by other modules' services INSIDE their
// own transaction (pass the tx) so the notification commits atomically with
// the event that caused it. In-app delivery is synchronous with the commit,
// so deliveryStatus is written as SENT once and never updated afterwards —
// readAt is the sole source of truth for unread.
const create = async (
    executor: Executor,
    input: CreateNotificationInput
): Promise<CreatedNotification> => {
    const { title, body } = buildNotificationContent(input.type, input.payload);

    const row = await NotificationRepository.insertNotification(executor, {
        userId: input.userId,
        notificationType: input.type,
        referenceEntityType: input.referenceEntityType,
        referenceEntityId: input.referenceEntityId,
        title,
        body,
        payload: input.payload,
        deliveryStatus: "SENT",
        sentAt: new Date(),
    });

    return { userId: input.userId, notification: toNotificationDto(row) };
};

// Payload base for ride-related notifications: route + departure. Dates are
// stored as ISO strings because the payload lives in jsonb.
const ridePayload = async (
    executor: Executor,
    rideId: string
): Promise<NotificationPayload> => {
    const summary = await NotificationRepository.getRideSummary(
        executor,
        rideId
    );
    if (!summary) return { rideId };

    return {
        rideId,
        originCity: summary.originCity,
        destinationCity: summary.destinationCity,
        departureAt: summary.departureAt.toISOString(),
    };
};

const actorName = async (
    executor: Executor,
    userId: string
): Promise<string | undefined> => {
    return (
        (await NotificationRepository.getUserDisplayName(executor, userId)) ??
        undefined
    );
};

// Push created notifications to their recipients' user topics. Must be called
// AFTER the creating transaction commits (mirrors chat's publish pattern) so
// a client can never see an event for a row that later rolled back.
const publishCreated = (created: CreatedNotification[]): void => {
    for (const { userId, notification } of created) {
        ChatRealtime.publishToUser(userId, {
            type: "notification",
            notification,
        });
    }
};

const listForUser = async (
    userId: string,
    limit: number,
    before?: Date,
    beforeId?: string
): Promise<Notification[]> => {
    const rows = await NotificationRepository.listByUser(
        db,
        userId,
        limit,
        before,
        beforeId
    );
    return rows.map(toNotificationDto);
};

const getUnreadCount = async (userId: string): Promise<{ count: number }> => {
    return { count: await NotificationRepository.countUnread(db, userId) };
};

// Idempotent: re-reading an already-read notification returns its existing
// readAt (matches the "re-issuing a transition is a no-op" convention).
// A foreign notification id maps to NotFound — no existence leak.
const markRead = async (
    id: string,
    userId: string
): Promise<{ id: string; readAt: Date }> => {
    const readAt = await NotificationRepository.markRead(db, id, userId);
    if (readAt) {
        return { id, readAt };
    }

    const existing = await NotificationRepository.findByIdForUser(
        db,
        id,
        userId
    );
    if (!existing || !existing.readAt) {
        throw new NotificationError(NotificationErrorCodes.NotFound);
    }

    return { id, readAt: existing.readAt };
};

const markAllRead = async (userId: string): Promise<{ updated: number }> => {
    return { updated: await NotificationRepository.markAllRead(db, userId) };
};

export const NotificationService = {
    create,
    ridePayload,
    actorName,
    publishCreated,
    listForUser,
    getUnreadCount,
    markRead,
    markAllRead,
};
