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

        await ChatRepository.lockConversationPair(
            tx,
            context.driverId,
            context.passengerId
        );
        const existing = await ChatRepository.findPairConversationId(
            tx,
            context.driverId,
            context.passengerId
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
    const messageById = new Map(lastMessages.map((m) => [m.id, m]));

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

    return await ChatRepository.findConversationMessages(
        db,
        conversationId,
        limit,
        before,
        beforeId
    );
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
    markRead,
};
