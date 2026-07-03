import { and, asc, count, desc, eq, isNull, lt, sql } from "drizzle-orm";
import type { Executor } from "../../db";
import { notifications as notificationsTable } from "../../db/schema/notification";
import { rides as ridesTable } from "../../db/schema/ride";
import { rideStops as rideStopsTable } from "../../db/schema/ride_stop";
import { users as usersTable } from "../../db/schema/user";
import type { NotificationRow, RideSummary } from "./notification.types";

const insertNotification = async (
    executor: Executor,
    values: typeof notificationsTable.$inferInsert
): Promise<NotificationRow> => {
    const [created] = await executor
        .insert(notificationsTable)
        .values(values)
        .returning();

    return created;
};

// Notifications for a user, newest first, optionally before a tuple cursor
// (same pattern as chat's findConversationMessages).
const listByUser = async (
    executor: Executor,
    userId: string,
    limit: number,
    before?: Date,
    beforeId?: string
): Promise<NotificationRow[]> => {
    return await executor
        .select()
        .from(notificationsTable)
        .where(
            and(
                eq(notificationsTable.userId, userId),
                before && beforeId
                    ? sql`(${notificationsTable.createdAt}, ${notificationsTable.id}) < (${before.toISOString()}, ${beforeId})`
                    : before
                      ? lt(notificationsTable.createdAt, before)
                      : undefined
            )
        )
        .orderBy(
            desc(notificationsTable.createdAt),
            desc(notificationsTable.id)
        )
        .limit(limit);
};

const countUnread = async (
    executor: Executor,
    userId: string
): Promise<number> => {
    const [row] = await executor
        .select({ value: count() })
        .from(notificationsTable)
        .where(
            and(
                eq(notificationsTable.userId, userId),
                isNull(notificationsTable.readAt)
            )
        );

    return row.value;
};

const findByIdForUser = async (
    executor: Executor,
    id: string,
    userId: string
): Promise<NotificationRow | null> => {
    const [row] = await executor
        .select()
        .from(notificationsTable)
        .where(
            and(
                eq(notificationsTable.id, id),
                eq(notificationsTable.userId, userId)
            )
        )
        .limit(1);

    return row ?? null;
};

// Flip a single unread notification to read. Returns the new readAt, or null
// when nothing matched (missing, foreign, or already read) — the service
// decides which of those it is. updatedAt is owned by the DB trigger.
const markRead = async (
    executor: Executor,
    id: string,
    userId: string
): Promise<Date | null> => {
    const [updated] = await executor
        .update(notificationsTable)
        .set({ readAt: sql`now()`, deliveryStatus: "READ" })
        .where(
            and(
                eq(notificationsTable.id, id),
                eq(notificationsTable.userId, userId),
                isNull(notificationsTable.readAt)
            )
        )
        .returning({ readAt: notificationsTable.readAt });

    return updated?.readAt ?? null;
};

const markAllRead = async (
    executor: Executor,
    userId: string
): Promise<number> => {
    const updated = await executor
        .update(notificationsTable)
        .set({ readAt: sql`now()`, deliveryStatus: "READ" })
        .where(
            and(
                eq(notificationsTable.userId, userId),
                isNull(notificationsTable.readAt)
            )
        )
        .returning({ id: notificationsTable.id });

    return updated.length;
};

// Origin/destination city + departure for notification text. City names are
// denormalized on ride_stops; stop 0 is the origin, the highest stopOrder is
// the destination.
const getRideSummary = async (
    executor: Executor,
    rideId: string
): Promise<RideSummary | null> => {
    const [ride] = await executor
        .select({ departureAt: ridesTable.departureAt })
        .from(ridesTable)
        .where(eq(ridesTable.id, rideId))
        .limit(1);

    if (!ride) return null;

    const stops = await executor
        .select({ city: rideStopsTable.city })
        .from(rideStopsTable)
        .where(eq(rideStopsTable.rideId, rideId))
        .orderBy(asc(rideStopsTable.stopOrder));

    if (stops.length === 0) return null;

    return {
        originCity: stops[0].city,
        destinationCity: stops[stops.length - 1].city,
        departureAt: ride.departureAt,
    };
};

const getUserDisplayName = async (
    executor: Executor,
    userId: string
): Promise<string | null> => {
    const [user] = await executor
        .select({
            firstName: usersTable.firstName,
            lastName: usersTable.lastName,
        })
        .from(usersTable)
        .where(eq(usersTable.id, userId))
        .limit(1);

    if (!user) return null;

    const name = [user.firstName, user.lastName].filter(Boolean).join(" ");
    return name.length > 0 ? name : null;
};

export const NotificationRepository = {
    insertNotification,
    listByUser,
    countUnread,
    findByIdForUser,
    markRead,
    markAllRead,
    getRideSummary,
    getUserDisplayName,
};
