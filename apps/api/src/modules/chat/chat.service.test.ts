import { describe, it, expect } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "../../db";
import { messages as messagesTable, users } from "../../db/schema";
import { ChatService } from "./chat.service";
import { ChatErrorCodes } from "./chat.errors";
import { BlockService } from "../blocks/block.service";
import { createRideContext, createTestUser } from "../../../test/factories";

/**
 * Sets up a ride with a confirmed passenger and returns the two participants
 * plus the booking id — the minimum needed to open a conversation.
 */
async function bookingChatContext() {
    const ctx = await createRideContext({ withPassenger: true });
    return {
        driverId: ctx.driver.id,
        passengerId: ctx.passenger!.id,
        bookingId: ctx.bookingId!,
    };
}

async function banUser(userId: string): Promise<void> {
    await db.update(users).set({ banned: true }).where(eq(users.id, userId));
}

describe("ChatService.getOrCreateConversation", () => {
    it("opens a conversation for the driver and reuses it for the passenger", async () => {
        const { driverId, passengerId, bookingId } =
            await bookingChatContext();

        const asDriver = await ChatService.getOrCreateConversation(
            bookingId,
            driverId
        );
        expect(asDriver).toEqual(expect.any(String));

        const asPassenger = await ChatService.getOrCreateConversation(
            bookingId,
            passengerId
        );
        // Exactly one thread per driver↔passenger pair.
        expect(asPassenger).toBe(asDriver);
    });

    it("rejects a user who is neither driver nor passenger (IDOR guard)", async () => {
        const { bookingId } = await bookingChatContext();
        const outsider = await createTestUser();

        await expect(
            ChatService.getOrCreateConversation(bookingId, outsider.id)
        ).rejects.toMatchObject({ code: ChatErrorCodes.NotAParticipant });
    });

    it("throws BookingNotFound for an unknown booking", async () => {
        const driver = await createTestUser();

        await expect(
            ChatService.getOrCreateConversation(crypto.randomUUID(), driver.id)
        ).rejects.toMatchObject({ code: ChatErrorCodes.BookingNotFound });
    });

    it("refuses to open a conversation with a banned counterpart", async () => {
        const { driverId, passengerId, bookingId } =
            await bookingChatContext();
        await banUser(passengerId);

        await expect(
            ChatService.getOrCreateConversation(bookingId, driverId)
        ).rejects.toMatchObject({ code: ChatErrorCodes.RecipientBanned });
    });
});

describe("ChatService.sendMessage", () => {
    it("stores a trimmed message and returns it", async () => {
        const { driverId, passengerId, bookingId } =
            await bookingChatContext();
        const conversationId = await ChatService.getOrCreateConversation(
            bookingId,
            driverId
        );

        const message = await ChatService.sendMessage(
            conversationId,
            passengerId,
            "  hello there  "
        );

        expect(message.content).toBe("hello there");
        expect(message.senderId).toBe(passengerId);
        expect(message.conversationId).toBe(conversationId);
    });

    it("rejects an empty / whitespace-only message", async () => {
        const { driverId, bookingId } = await bookingChatContext();
        const conversationId = await ChatService.getOrCreateConversation(
            bookingId,
            driverId
        );

        await expect(
            ChatService.sendMessage(conversationId, driverId, "   ")
        ).rejects.toMatchObject({ code: ChatErrorCodes.MessageEmpty });
    });

    it("rejects a non-participant sender (IDOR guard)", async () => {
        const { driverId, bookingId } = await bookingChatContext();
        const conversationId = await ChatService.getOrCreateConversation(
            bookingId,
            driverId
        );
        const outsider = await createTestUser();

        await expect(
            ChatService.sendMessage(conversationId, outsider.id, "hi")
        ).rejects.toMatchObject({ code: ChatErrorCodes.NotAParticipant });
    });

    it("throws ConversationNotFound for an unknown conversation", async () => {
        const user = await createTestUser();

        await expect(
            ChatService.sendMessage(crypto.randomUUID(), user.id, "hi")
        ).rejects.toMatchObject({ code: ChatErrorCodes.ConversationNotFound });
    });

    it("blocks sending when the pair is blocked", async () => {
        const { driverId, passengerId, bookingId } =
            await bookingChatContext();
        const conversationId = await ChatService.getOrCreateConversation(
            bookingId,
            driverId
        );

        await BlockService.blockUser({
            blockerId: passengerId,
            blockedUserId: driverId,
            reason: "HARASSMENT",
        });

        await expect(
            ChatService.sendMessage(conversationId, driverId, "let me in")
        ).rejects.toMatchObject({ code: ChatErrorCodes.Blocked });
    });

    it("refuses to send to a banned counterpart", async () => {
        const { driverId, passengerId, bookingId } =
            await bookingChatContext();
        const conversationId = await ChatService.getOrCreateConversation(
            bookingId,
            driverId
        );
        await banUser(passengerId);

        await expect(
            ChatService.sendMessage(conversationId, driverId, "hi")
        ).rejects.toMatchObject({ code: ChatErrorCodes.RecipientBanned });
    });
});

describe("ChatService.getMessages", () => {
    it("rejects a non-participant reader (IDOR guard)", async () => {
        const { driverId, bookingId } = await bookingChatContext();
        const conversationId = await ChatService.getOrCreateConversation(
            bookingId,
            driverId
        );
        const outsider = await createTestUser();

        await expect(
            ChatService.getMessages(conversationId, outsider.id, 50)
        ).rejects.toMatchObject({ code: ChatErrorCodes.NotAParticipant });
    });

    it("throws ConversationNotFound for an unknown conversation", async () => {
        const user = await createTestUser();

        await expect(
            ChatService.getMessages(crypto.randomUUID(), user.id, 50)
        ).rejects.toMatchObject({ code: ChatErrorCodes.ConversationNotFound });
    });

    it("returns messages oldest-first and honours the limit + before cursor", async () => {
        const { driverId, passengerId, bookingId } =
            await bookingChatContext();
        const conversationId = await ChatService.getOrCreateConversation(
            bookingId,
            driverId
        );

        // Insert four messages with controlled, distinct timestamps so the
        // ordering / cursor assertions don't depend on wall-clock spacing.
        const base = Date.now();
        const rows = [0, 1, 2, 3].map((i) => ({
            conversationId,
            senderId: i % 2 === 0 ? driverId : passengerId,
            messageType: "TEXT" as const,
            content: `msg-${i}`,
            sentAt: new Date(base + i * 1000),
        }));
        await db.insert(messagesTable).values(rows);

        const all = await ChatService.getMessages(conversationId, driverId, 50);
        expect(all.map((m) => m.content)).toEqual([
            "msg-0",
            "msg-1",
            "msg-2",
            "msg-3",
        ]);

        // limit returns the newest N, still oldest-first within the page.
        const lastTwo = await ChatService.getMessages(
            conversationId,
            driverId,
            2
        );
        expect(lastTwo.map((m) => m.content)).toEqual(["msg-2", "msg-3"]);

        // before cursor: everything strictly older than msg-2's timestamp.
        const older = await ChatService.getMessages(
            conversationId,
            driverId,
            50,
            new Date(base + 2 * 1000)
        );
        expect(older.map((m) => m.content)).toEqual(["msg-0", "msg-1"]);
    });
});

describe("ChatService.getConversations & markRead", () => {
    it("reports unread counts that clear after markRead", async () => {
        const { driverId, passengerId, bookingId } =
            await bookingChatContext();
        const conversationId = await ChatService.getOrCreateConversation(
            bookingId,
            driverId
        );

        await ChatService.sendMessage(conversationId, passengerId, "first");
        await ChatService.sendMessage(conversationId, passengerId, "second");

        const beforeRead = await ChatService.getConversations(driverId);
        const driverView = beforeRead.find((c) => c.id === conversationId);
        expect(driverView).toBeDefined();
        expect(driverView!.unreadCount).toBe(2);
        expect(driverView!.myRole).toBe("DRIVER");
        expect(driverView!.counterpart.id).toBe(passengerId);

        await ChatService.markRead(conversationId, driverId);

        const afterRead = await ChatService.getConversations(driverId);
        expect(
            afterRead.find((c) => c.id === conversationId)!.unreadCount
        ).toBe(0);
    });

    it("flags conversations where the pair is blocked", async () => {
        const { driverId, passengerId, bookingId } =
            await bookingChatContext();
        const conversationId = await ChatService.getOrCreateConversation(
            bookingId,
            driverId
        );

        await BlockService.blockUser({
            blockerId: driverId,
            blockedUserId: passengerId,
            reason: "OTHER",
        });

        const list = await ChatService.getConversations(driverId);
        expect(list.find((c) => c.id === conversationId)!.isBlocked).toBe(true);
    });

    it("rejects markRead from a non-participant (IDOR guard)", async () => {
        const { driverId, bookingId } = await bookingChatContext();
        const conversationId = await ChatService.getOrCreateConversation(
            bookingId,
            driverId
        );
        const outsider = await createTestUser();

        await expect(
            ChatService.markRead(conversationId, outsider.id)
        ).rejects.toMatchObject({ code: ChatErrorCodes.NotAParticipant });
    });
});
