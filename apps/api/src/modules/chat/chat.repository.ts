import {
    and,
    aliasedTable,
    desc,
    eq,
    inArray,
    isNull,
    lt,
    or,
    sql,
} from "drizzle-orm";
import type { Executor } from "../../db";
import { conversations as conversationsTable } from "../../db/schema/conversation";
import { messages as messagesTable } from "../../db/schema/message";
import { bookings as bookingsTable } from "../../db/schema/booking";
import { rides as ridesTable } from "../../db/schema/ride";
import { users as usersTable } from "../../db/schema/user";
import { blocklist as blocklistTable } from "../../db/schema/blocklist";
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

// Is the user banned? Checks both the better-auth `banned` flag and the domain
// `user_status` so either path that revokes an account counts. Used to stop
// anyone messaging a banned counterpart (the banned user can't read it anyway,
// and is rejected at the auth layer the moment they try to act).
const isUserBanned = async (
    executor: Executor,
    userId: string
): Promise<boolean> => {
    const [row] = await executor
        .select({
            banned: usersTable.banned,
            userStatus: usersTable.userStatus,
        })
        .from(usersTable)
        .where(eq(usersTable.id, userId))
        .limit(1);

    return row ? row.banned || row.userStatus === "BANNED" : false;
};

// Serialize get-or-create for one driver↔passenger pair: a transaction-scoped
// advisory lock so two concurrent "open conversation" requests for the same
// pair can't both slip past the find-by-pair below and each insert a thread.
// Auto-released when the surrounding transaction commits or rolls back. hashtext
// collisions only cause occasional extra serialization, never wrong results.
const lockConversationPair = async (
    executor: Executor,
    driverId: string,
    passengerId: string
): Promise<void> => {
    await executor.execute(
        sql`SELECT pg_advisory_xact_lock(hashtext(${driverId}), hashtext(${passengerId}))`
    );
};

// The single conversation between a given driver and passenger, regardless of
// which booking first opened it — there is exactly one thread per pair. Returns
// the oldest match so the choice is stable if duplicates ever exist.
const findPairConversationId = async (
    executor: Executor,
    driverId: string,
    passengerId: string
): Promise<string | null> => {
    const [row] = await executor
        .select({ id: conversationsTable.id })
        .from(conversationsTable)
        .innerJoin(
            bookingsTable,
            eq(conversationsTable.bookingId, bookingsTable.id)
        )
        .innerJoin(ridesTable, eq(bookingsTable.rideId, ridesTable.id))
        .where(
            and(
                conversationNotSoftDeleted,
                eq(ridesTable.driverId, driverId),
                eq(bookingsTable.passengerId, passengerId)
            )
        )
        .orderBy(conversationsTable.createdAt)
        .limit(1);

    return row?.id ?? null;
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
        .innerJoin(
            bookingsTable,
            eq(conversationsTable.bookingId, bookingsTable.id)
        )
        .innerJoin(ridesTable, eq(bookingsTable.rideId, ridesTable.id))
        .where(
            and(
                eq(conversationsTable.id, conversationId),
                conversationNotSoftDeleted
            )
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
        ORDER BY ${messagesTable.sentAt} DESC, ${messagesTable.id} DESC
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

    const isBlocked = sql<boolean>`EXISTS (
        SELECT 1 FROM ${blocklistTable}
        WHERE ${blocklistTable.blockStatus} = 'ACTIVE'
          AND ${blocklistTable.revokedAt} IS NULL
          AND ${blocklistTable.deletedAt} IS NULL
          AND (
            (${blocklistTable.blockerUserId} = ${ridesTable.driverId} AND ${blocklistTable.blockedUserId} = ${bookingsTable.passengerId}) OR
            (${blocklistTable.blockerUserId} = ${bookingsTable.passengerId} AND ${blocklistTable.blockedUserId} = ${ridesTable.driverId})
          )
    )`;

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
            // Ban flags for both sides so the service can mark the caller's
            // counterpart as banned — the UI disables the composer for a banned
            // recipient (same idea as isUserBanned, kept inline to avoid N+1).
            driverBanned: sql<boolean>`(${driverUser.banned} OR ${driverUser.userStatus} = 'BANNED')`,
            passengerBanned: sql<boolean>`(${passengerUser.banned} OR ${passengerUser.userStatus} = 'BANNED')`,
            lastMessageId,
            unreadCount,
            isBlocked,
        })
        .from(conversationsTable)
        .innerJoin(
            bookingsTable,
            eq(conversationsTable.bookingId, bookingsTable.id)
        )
        .innerJoin(ridesTable, eq(bookingsTable.rideId, ridesTable.id))
        .innerJoin(driverUser, eq(ridesTable.driverId, driverUser.id))
        .innerJoin(
            passengerUser,
            eq(bookingsTable.passengerId, passengerUser.id)
        )
        .where(
            and(
                conversationNotSoftDeleted,
                or(
                    eq(ridesTable.driverId, userId),
                    eq(bookingsTable.passengerId, userId)
                )
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
    before?: Date,
    beforeId?: string
): Promise<Message[]> => {
    const rows = await executor
        .select(messageColumns)
        .from(messagesTable)
        .where(
            and(
                eq(messagesTable.conversationId, conversationId),
                messageNotSoftDeleted,
                before && beforeId
                    ? sql`(${messagesTable.sentAt}, ${messagesTable.id}) < (${before.toISOString()}, ${beforeId})`
                    : before
                      ? lt(messagesTable.sentAt, before)
                      : undefined
            )
        )
        .orderBy(desc(messagesTable.sentAt), desc(messagesTable.id))
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
    isUserBanned,
    lockConversationPair,
    findPairConversationId,
    findConversationContext,
    insertConversation,
    findUserConversations,
    findMessagesByIds,
    findConversationMessages,
    insertMessage,
    updateLastReadAt,
};
