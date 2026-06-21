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

// Decide which side of a two-party conversation the user is on, or reject.
const resolveRole = (
    context: ConversationParticipants,
    userId: string
): ConversationRole => {
    if (context.driverId === userId) return "DRIVER";
    if (context.passengerId === userId) return "PASSENGER";
    throw new ChatError(ChatErrorCodes.NotAParticipant);
};

// Open (or reuse) the booking-scoped conversation between the booking's driver
// and passenger. Idempotent: a booking has at most one live conversation.
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

        // Exactly one conversation per driver↔passenger pair, regardless of how
        // many bookings they share — reuse any existing thread between the two
        // instead of opening a booking-specific one. An existing conversation
        // can always be reopened, even between blocked users, so the thread
        // stays viewable (the UI shows the blocked banner and disables the
        // composer, and sendMessage enforces the block on its own). Only the
        // creation of a brand-new conversation is blocked.
        //
        // Lock the pair first so concurrent opens serialize — without it two
        // requests could both find nothing here and each insert a thread.
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

        // No new thread to a banned recipient — they can't read it. An existing
        // thread is still returned above so its history stays readable.
        if (await ChatRepository.isUserBanned(tx, counterpartId)) {
            throw new ChatError(ChatErrorCodes.RecipientBanned);
        }

        // Distinguish the two block directions so the client can explain why:
        // a block the caller created is fixable by unblocking, the
        // counterpart's block is not (and the caller can't see it via /blocks).
        const blockDirection = await BlockService.getBlockDirection(
            userId,
            counterpartId,
            tx
        );
        if (blockDirection === "BY_ME") {
            throw new ChatError(ChatErrorCodes.Blocked);
        }
        if (blockDirection === "BY_OTHER") {
            throw new ChatError(ChatErrorCodes.BlockedByOther);
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
        // Drives the disabled composer + notice on the counterpart-banned thread.
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
    before?: Date
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
        before
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

        // Sending implies you've seen everything up to your own message.
        await ChatRepository.updateLastReadAt(
            tx,
            conversationId,
            role,
            message.sentAt
        );

        return { message, context };
    });

    // Broadcast only after the transaction commits, so a rolled-back write is
    // never delivered to a live socket.
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

    // Let the counterpart's live clients clear unread / show the read receipt.
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
