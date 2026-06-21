import { and, aliasedTable, desc, eq, inArray, isNull, lt, or, sql } from "drizzle-orm";
import type { Executor } from "../../db";
import { conversations as conversationsTable } from "../../db/schema/conversation";
import { messages as messagesTable } from "../../db/schema/message";
import { bookings as bookingsTable } from "../../db/schema/booking";
import { rides as ridesTable } from "../../db/schema/ride";
import { users as usersTable } from "../../db/schema/user";
import type { ConversationParticipants, ConversationType } from "./chat.types";
import type { Message } from "@repo/shared";

const conversationNotSoftDeleted = isNull(conversationsTable.deletedAt);
const messageNotSoftDeleted = isNull(messagesTable.deletedAt);

const driverUser = aliasedTable(usersTable, "chat_driver");
const passengerUser = aliasedTable(usersTable, "chat_passenger");

const messageColumns = {
    id: messagesTable.id,
    conversationId: messagesTable.conversationId,
    senderId: messagesTable.senderId,
    messageType: messagesTable.messageType,
    content: messagesTable.content,
    sentAt: messagesTable.sentAt,
    editedAt: messagesTable.editedAt,
};

// Resolve the two parties of a booking-scoped conversation from the booking and
// its ride, plus the existing conversation id (if one was already opened).
const findBookingContext = async (
    executor: Executor,
    bookingId: string
): Promise<ConversationParticipants | null> => {
    const [row] = await executor
        .select({
            conversationId: conversationsTable.id,
            bookingId: bookingsTable.id,
            rideId: ridesTable.id,
            driverId: ridesTable.driverId,
            passengerId: bookingsTable.passengerId,
        })
        .from(bookingsTable)
        .innerJoin(ridesTable, eq(bookingsTable.rideId, ridesTable.id))
        .leftJoin(
            conversationsTable,
            and(
                eq(conversationsTable.bookingId, bookingsTable.id),
                conversationNotSoftDeleted
            )
        )
        .where(
            and(
                eq(bookingsTable.id, bookingId),
                isNull(bookingsTable.deletedAt),
                isNull(ridesTable.deletedAt)
            )
        )
        .limit(1);

    return row ?? null;
};

// Same resolution as findBookingContext but keyed by the conversation id.
const findConversationContext = async (
    executor: Executor,
    conversationId: string
): Promise<ConversationParticipants | null> => {
    const [row] = await executor
        .select({
            conversationId: conversationsTable.id,
            bookingId: bookingsTable.id,
            rideId: ridesTable.id,
            driverId: ridesTable.driverId,
            passengerId: bookingsTable.passengerId,
        })
        .from(conversationsTable)
        .innerJoin(bookingsTable, eq(conversationsTable.bookingId, bookingsTable.id))
        .innerJoin(ridesTable, eq(bookingsTable.rideId, ridesTable.id))
        .where(
            and(eq(conversationsTable.id, conversationId), conversationNotSoftDeleted)
        )
        .limit(1);

    return row ?? null;
};

const insertConversation = async (
    executor: Executor,
    values: {
        bookingId: string;
        rideId: string;
        conversationType: ConversationType;
    }
): Promise<{ id: string }> => {
    const [created] = await executor
        .insert(conversationsTable)
        .values(values)
        .returning({ id: conversationsTable.id });

    return created;
};

// Inbox: every conversation the user takes part in (as driver or passenger),
// with both user previews, the latest message, and the user's unread count.
const findUserConversations = async (executor: Executor, userId: string) => {
    const lastReadThreshold = sql`CASE WHEN ${ridesTable.driverId} = ${userId} THEN ${conversationsTable.driverLastReadAt} ELSE ${conversationsTable.passengerLastReadAt} END`;

    const lastMessageId = sql<string | null>`(
        SELECT ${messagesTable.id}
        FROM ${messagesTable}
        WHERE ${messagesTable.conversationId} = ${conversationsTable.id}
          AND ${messagesTable.deletedAt} IS NULL
        ORDER BY ${messagesTable.sentAt} DESC
        LIMIT 1
    )`;

    const unreadCount = sql<number>`(
        SELECT COUNT(*)::int
        FROM ${messagesTable}
        WHERE ${messagesTable.conversationId} = ${conversationsTable.id}
          AND ${messagesTable.deletedAt} IS NULL
          AND ${messagesTable.senderId} <> ${userId}
          AND (${lastReadThreshold} IS NULL OR ${messagesTable.sentAt} > ${lastReadThreshold})
    )`;

    const lastActivityAt = sql`COALESCE((
        SELECT MAX(${messagesTable.sentAt})
        FROM ${messagesTable}
        WHERE ${messagesTable.conversationId} = ${conversationsTable.id}
          AND ${messagesTable.deletedAt} IS NULL
    ), ${conversationsTable.updatedAt})`;

    return await executor
        .select({
            id: conversationsTable.id,
            conversationType: conversationsTable.conversationType,
            bookingId: conversationsTable.bookingId,
            rideId: conversationsTable.rideId,
            updatedAt: conversationsTable.updatedAt,
            driverId: ridesTable.driverId,
            passengerId: bookingsTable.passengerId,
            driver: {
                id: driverUser.id,
                firstName: driverUser.firstName,
                lastName: driverUser.lastName,
                profilePhotoUrl: driverUser.profilePhotoUrl,
            },
            passenger: {
                id: passengerUser.id,
                firstName: passengerUser.firstName,
                lastName: passengerUser.lastName,
                profilePhotoUrl: passengerUser.profilePhotoUrl,
            },
            lastMessageId,
            unreadCount,
        })
        .from(conversationsTable)
        .innerJoin(bookingsTable, eq(conversationsTable.bookingId, bookingsTable.id))
        .innerJoin(ridesTable, eq(bookingsTable.rideId, ridesTable.id))
        .innerJoin(driverUser, eq(ridesTable.driverId, driverUser.id))
        .innerJoin(passengerUser, eq(bookingsTable.passengerId, passengerUser.id))
        .where(
            and(
                conversationNotSoftDeleted,
                or(eq(ridesTable.driverId, userId), eq(bookingsTable.passengerId, userId))
            )
        )
        .orderBy(desc(lastActivityAt));
};

const findMessagesByIds = async (
    executor: Executor,
    ids: string[]
): Promise<Message[]> => {
    if (ids.length === 0) return [];

    return await executor
        .select(messageColumns)
        .from(messagesTable)
        .where(and(inArray(messagesTable.id, ids), messageNotSoftDeleted));
};

// Messages in a conversation, newest first, optionally before a cursor.
// Returned ascending (oldest first) so the client can append in render order.
const findConversationMessages = async (
    executor: Executor,
    conversationId: string,
    limit: number,
    before?: Date
): Promise<Message[]> => {
    const rows = await executor
        .select(messageColumns)
        .from(messagesTable)
        .where(
            and(
                eq(messagesTable.conversationId, conversationId),
                messageNotSoftDeleted,
                before ? lt(messagesTable.sentAt, before) : undefined
            )
        )
        .orderBy(desc(messagesTable.sentAt))
        .limit(limit);

    return rows.reverse();
};

const insertMessage = async (
    executor: Executor,
    values: {
        conversationId: string;
        senderId: string;
        content: string;
    }
): Promise<Message> => {
    const [created] = await executor
        .insert(messagesTable)
        .values({
            conversationId: values.conversationId,
            senderId: values.senderId,
            content: values.content,
            messageType: "TEXT",
            sentAt: new Date(),
        })
        .returning(messageColumns);

    return created;
};

const updateLastReadAt = async (
    executor: Executor,
    conversationId: string,
    role: "DRIVER" | "PASSENGER",
    at: Date
): Promise<void> => {
    await executor
        .update(conversationsTable)
        .set(
            role === "DRIVER"
                ? { driverLastReadAt: at }
                : { passengerLastReadAt: at }
        )
        .where(eq(conversationsTable.id, conversationId));
};

export const ChatRepository = {
    findBookingContext,
    findConversationContext,
    insertConversation,
    findUserConversations,
    findMessagesByIds,
    findConversationMessages,
    insertMessage,
    updateLastReadAt,
};
