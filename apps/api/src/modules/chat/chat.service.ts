import { db } from "../../db";
import { ChatRepository } from "./chat.repository";
import { ChatRealtime } from "./chat.realtime";
import { ChatError, ChatErrorCodes } from "./chat.errors";
import { BlockService } from "../blocks/block.service";
import type {
    ConversationListItem,
    ConversationParticipants,
} from "./chat.types";
import type { ConversationRole, Message } from "@repo/shared";

const resolveRole = (
    context: ConversationParticipants,
    userId: string
): ConversationRole => {
    if (context.driverId === userId) return "DRIVER";
    if (context.passengerId === userId) return "PASSENGER";
    throw new ChatError(ChatErrorCodes.NotAParticipant);
};

// How long after sending a message its author may edit or delete it.
const MESSAGE_MODIFY_WINDOW_MS = 15 * 60 * 1000;

// A deleted message stays in threads as a tombstone, but its real content must
// never leave the server. Applied everywhere messages are read or broadcast.
const maskDeleted = (message: Message): Message =>
    message.deletedAt ? { ...message, content: "" } : message;

// Shared preamble of editMessage/deleteMessage: participant check + ownership
// + only user-authored TEXT messages + the modification window.
const findOwnModifiableMessage = async (
    conversationId: string,
    messageId: string,
    userId: string
): Promise<{ context: ConversationParticipants; message: Message }> => {
    const context = await ChatRepository.findConversationContext(
        db,
        conversationId
    );
    if (!context) {
        throw new ChatError(ChatErrorCodes.ConversationNotFound);
    }
    resolveRole(context, userId);

    const message = await ChatRepository.findMessageInConversation(
        db,
        conversationId,
        messageId
    );
    if (!message || message.messageType !== "TEXT") {
        throw new ChatError(ChatErrorCodes.MessageNotFound);
    }
    if (message.senderId !== userId) {
        throw new ChatError(ChatErrorCodes.NotMessageSender);
    }

    return { context, message };
};

const assertWithinModifyWindow = (message: Message): void => {
    if (Date.now() - message.sentAt.getTime() > MESSAGE_MODIFY_WINDOW_MS) {
        throw new ChatError(ChatErrorCodes.MessageWindowExpired);
    }
};

const publishUpdated = (
    context: ConversationParticipants,
    conversationId: string,
    message: Message
): void => {
    ChatRealtime.notifyMessageUpdated(
        context.driverId,
        context.passengerId,
        conversationId,
        message
    );
};

const getOrCreateConversation = async (
    bookingId: string,
    userId: string
): Promise<string> => {
    return await db.transaction(async (tx) => {
        const context = await ChatRepository.findBookingContext(tx, bookingId);

        if (!context) {
            throw new ChatError(ChatErrorCodes.BookingNotFound);
        }

        const role = resolveRole(context, userId);

        // Threads are ride-scoped: the same driver↔passenger pair gets one
        // thread per ride, so conversations stay tied to the ride they concern
        // (and admin report moderation resolves exactly the reported ride's
        // thread via conversations.ride_id).
        await ChatRepository.lockConversationPair(
            tx,
            context.driverId,
            context.passengerId,
            context.rideId
        );
        const existing = await ChatRepository.findRideConversationId(
            tx,
            context.driverId,
            context.passengerId,
            context.rideId
        );
        if (existing) {
            return existing;
        }

        const counterpartId =
            role === "DRIVER" ? context.passengerId : context.driverId;

        if (await ChatRepository.isUserBanned(tx, counterpartId)) {
            throw new ChatError(ChatErrorCodes.RecipientBanned);
        }

        const created = await ChatRepository.insertConversation(tx, {
            bookingId: context.bookingId,
            rideId: context.rideId,
            conversationType: "BOOKING",
        });

        return created.id;
    });
};

const getConversations = async (
    userId: string
): Promise<ConversationListItem[]> => {
    const rows = await ChatRepository.findUserConversations(db, userId);

    const lastMessageIds = rows
        .map((row) => row.lastMessageId)
        .filter((id): id is string => id !== null);

    const lastMessages = await ChatRepository.findMessagesByIds(
        db,
        lastMessageIds
    );
    const messageById = new Map(
        lastMessages.map((m) => [m.id, maskDeleted(m)])
    );

    return rows.map((row) => {
        const myRole: ConversationRole =
            row.driverId === userId ? "DRIVER" : "PASSENGER";
        const counterpart = myRole === "DRIVER" ? row.passenger : row.driver;
        const counterpartBanned =
            myRole === "DRIVER" ? row.passengerBanned : row.driverBanned;

        return {
            id: row.id,
            conversationType: row.conversationType,
            bookingId: row.bookingId,
            rideId: row.rideId,
            myRole,
            counterpart,
            counterpartBanned,
            lastMessage: row.lastMessageId
                ? (messageById.get(row.lastMessageId) ?? null)
                : null,
            unreadCount: row.unreadCount,
            updatedAt: row.updatedAt,
            isBlocked: row.isBlocked,
            rideOriginCity: row.rideOriginCity,
            rideDestinationCity: row.rideDestinationCity,
            rideDepartureAt: row.rideDepartureAt,
        };
    });
};

const getMessages = async (
    conversationId: string,
    userId: string,
    limit: number,
    before?: Date,
    beforeId?: string
): Promise<Message[]> => {
    const context = await ChatRepository.findConversationContext(
        db,
        conversationId
    );

    if (!context) {
        throw new ChatError(ChatErrorCodes.ConversationNotFound);
    }

    resolveRole(context, userId);

    const messages = await ChatRepository.findConversationMessages(
        db,
        conversationId,
        limit,
        before,
        beforeId
    );

    return messages.map(maskDeleted);
};

const sendMessage = async (
    conversationId: string,
    userId: string,
    content: string
): Promise<Message> => {
    const trimmed = content.trim();
    if (trimmed.length === 0) {
        throw new ChatError(ChatErrorCodes.MessageEmpty);
    }

    const { message, context } = await db.transaction(async (tx) => {
        const context = await ChatRepository.findConversationContext(
            tx,
            conversationId
        );

        if (!context) {
            throw new ChatError(ChatErrorCodes.ConversationNotFound);
        }

        const role = resolveRole(context, userId);

        const counterpartId =
            role === "DRIVER" ? context.passengerId : context.driverId;
        if (await ChatRepository.isUserBanned(tx, counterpartId)) {
            throw new ChatError(ChatErrorCodes.RecipientBanned);
        }

        if (
            await BlockService.isBlockedBetween(
                context.driverId,
                context.passengerId,
                tx
            )
        ) {
            throw new ChatError(ChatErrorCodes.Blocked);
        }

        const message = await ChatRepository.insertMessage(tx, {
            conversationId,
            senderId: userId,
            content: trimmed,
        });

        await ChatRepository.updateLastReadAt(
            tx,
            conversationId,
            role,
            message.sentAt
        );

        return { message, context };
    });

    ChatRealtime.notifyMessage(
        context.driverId,
        context.passengerId,
        conversationId,
        message
    );

    return message;
};

// Edit the caller's own message. Deliberately no block/banned checks —
// managing content you already sent is always allowed (nothing new reaches
// the counterpart beyond a changed wording, and delete must never be
// blockable).
const editMessage = async (
    conversationId: string,
    messageId: string,
    userId: string,
    content: string
): Promise<Message> => {
    const trimmed = content.trim();
    if (trimmed.length === 0) {
        throw new ChatError(ChatErrorCodes.MessageEmpty);
    }

    const { context, message } = await findOwnModifiableMessage(
        conversationId,
        messageId,
        userId
    );

    // A tombstoned message is gone as an editable resource.
    if (message.deletedAt) {
        throw new ChatError(ChatErrorCodes.MessageNotFound);
    }
    assertWithinModifyWindow(message);

    const updated = await ChatRepository.updateMessageContent(
        db,
        messageId,
        trimmed
    );
    if (!updated) {
        // Race: deleted between the check and the guarded update.
        throw new ChatError(ChatErrorCodes.MessageNotFound);
    }

    publishUpdated(context, conversationId, updated);

    return updated;
};

// Soft-delete (tombstone) the caller's own message. Re-issuing the delete is a
// no-op that returns the existing tombstone, matching the project's
// idempotent-transition convention.
const deleteMessage = async (
    conversationId: string,
    messageId: string,
    userId: string
): Promise<Message> => {
    const { context, message } = await findOwnModifiableMessage(
        conversationId,
        messageId,
        userId
    );

    if (message.deletedAt) {
        return maskDeleted(message);
    }
    assertWithinModifyWindow(message);

    const deleted = await ChatRepository.softDeleteMessage(db, messageId);
    if (!deleted) {
        // Race: another delete won; re-read for the idempotent response.
        const current = await ChatRepository.findMessageInConversation(
            db,
            conversationId,
            messageId
        );
        if (!current) throw new ChatError(ChatErrorCodes.MessageNotFound);
        return maskDeleted(current);
    }

    const tombstone = maskDeleted(deleted);
    publishUpdated(context, conversationId, tombstone);

    return tombstone;
};

const markRead = async (
    conversationId: string,
    userId: string
): Promise<{ id: string; lastReadAt: Date }> => {
    const context = await ChatRepository.findConversationContext(
        db,
        conversationId
    );

    if (!context) {
        throw new ChatError(ChatErrorCodes.ConversationNotFound);
    }

    const role = resolveRole(context, userId);
    const lastReadAt = new Date();

    await ChatRepository.updateLastReadAt(db, conversationId, role, lastReadAt);

    const counterpartId =
        role === "DRIVER" ? context.passengerId : context.driverId;
    ChatRealtime.notifyRead(counterpartId, conversationId, userId, lastReadAt);

    return { id: conversationId, lastReadAt };
};

export const ChatService = {
    getOrCreateConversation,
    getConversations,
    getMessages,
    sendMessage,
    editMessage,
    deleteMessage,
    markRead,
};
