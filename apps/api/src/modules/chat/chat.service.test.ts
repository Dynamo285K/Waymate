import { describe, it, expect } from "vitest";
import { asc, eq } from "drizzle-orm";
import { db } from "../../db";
import { messages as messagesTable, rideStops, users } from "../../db/schema";
import { ChatService } from "./chat.service";
import { ChatErrorCodes } from "./chat.errors";
import { BlockService } from "../blocks/block.service";
import { RideService } from "../rides/ride.service";
import { BookingService } from "../bookings/booking.service";
import {
    buildRideBody,
    createRideContext,
    createTestUser,
} from "../../../test/factories";

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
        const { driverId, passengerId, bookingId } = await bookingChatContext();

        const asDriver = await ChatService.getOrCreateConversation(
            bookingId,
            driverId
        );
        expect(asDriver).toEqual(expect.any(String));

        const asPassenger = await ChatService.getOrCreateConversation(
            bookingId,
            passengerId
        );
        // Exactly one thread per driver↔passenger pair per ride.
        expect(asPassenger).toBe(asDriver);
    });

    it("opens a separate thread for the same pair on a different ride", async () => {
        const ctx = await createRideContext({ withPassenger: true });

        // Second ride by the same driver, booked by the same passenger.
        const secondRideId = await RideService.createRide(
            ctx.driver.id,
            buildRideBody(
                ctx.car.id,
                new Date(Date.now() + 48 * 60 * 60 * 1000)
            )
        );
        const stops = await db
            .select()
            .from(rideStops)
            .where(eq(rideStops.rideId, secondRideId))
            .orderBy(asc(rideStops.stopOrder));
        const secondBookingId = await BookingService.createBookingRequest({
            rideId: secondRideId,
            passengerId: ctx.passenger!.id,
            pickupStopId: stops[0].id,
            dropoffStopId: stops[stops.length - 1].id,
            seatCount: 1,
        });

        const firstThread = await ChatService.getOrCreateConversation(
            ctx.bookingId!,
            ctx.driver.id
        );
        const secondThread = await ChatService.getOrCreateConversation(
            secondBookingId,
            ctx.driver.id
        );

        expect(secondThread).not.toBe(firstThread);
        // Re-opening either booking keeps returning its ride's thread.
        await expect(
            ChatService.getOrCreateConversation(
                secondBookingId,
                ctx.passenger!.id
            )
        ).resolves.toBe(secondThread);
    });

    it("exposes the ride route and departure on inbox items", async () => {
        const ctx = await createRideContext({ withPassenger: true });
        await ChatService.getOrCreateConversation(
            ctx.bookingId!,
            ctx.driver.id
        );

        const [item] = await ChatService.getConversations(ctx.driver.id);
        expect(item.rideOriginCity).toBe("Bratislava");
        expect(item.rideDestinationCity).toBe("Trnava");
        expect(item.rideDepartureAt).toBeInstanceOf(Date);
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
        const { driverId, passengerId, bookingId } = await bookingChatContext();
        await banUser(passengerId);

        await expect(
            ChatService.getOrCreateConversation(bookingId, driverId)
        ).rejects.toMatchObject({ code: ChatErrorCodes.RecipientBanned });
    });
});

describe("ChatService.sendMessage", () => {
    it("stores a trimmed message and returns it", async () => {
        const { driverId, passengerId, bookingId } = await bookingChatContext();
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
        const { driverId, passengerId, bookingId } = await bookingChatContext();
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
        const { driverId, passengerId, bookingId } = await bookingChatContext();
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
        const { driverId, passengerId, bookingId } = await bookingChatContext();
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

    it("paginates stably when messages share the exact same sentAt", async () => {
        const { driverId, bookingId } = await bookingChatContext();
        const conversationId = await ChatService.getOrCreateConversation(
            bookingId,
            driverId
        );

        const base = new Date();

        // Insert 3 messages with the exact same timestamp
        await Promise.all(
            ["m1", "m2", "m3"].map((content) =>
                db
                    .insert(messagesTable)
                    .values({
                        conversationId,
                        senderId: driverId,
                        content,
                        messageType: "TEXT",
                        sentAt: base,
                    })
                    .returning()
            )
        );

        // Fetch all 3 to establish their order (ascending by default return)
        const all = await ChatService.getMessages(conversationId, driverId, 3);
        expect(all).toHaveLength(3);

        // Paginate using the middle one as cursor (keyset pagination)
        const cursorMsg = all[1];
        const older = await ChatService.getMessages(
            conversationId,
            driverId,
            1,
            cursorMsg.sentAt,
            cursorMsg.id
        );

        // It should precisely return the oldest one (which is all[0]) without skipping or duplicating
        expect(older).toHaveLength(1);
        expect(older[0].id).toBe(all[0].id);
    });
});

describe("ChatService.getConversations & markRead", () => {
    it("reports unread counts that clear after markRead", async () => {
        const { driverId, passengerId, bookingId } = await bookingChatContext();
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
        const { driverId, passengerId, bookingId } = await bookingChatContext();
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

describe("ChatService.editMessage", () => {
    async function conversationWithMessage() {
        const { driverId, passengerId, bookingId } = await bookingChatContext();
        const conversationId = await ChatService.getOrCreateConversation(
            bookingId,
            driverId
        );
        const message = await ChatService.sendMessage(
            conversationId,
            driverId,
            "original"
        );
        return { driverId, passengerId, conversationId, message };
    }

    async function backdateMessage(messageId: string, minutes: number) {
        await db
            .update(messagesTable)
            .set({ sentAt: new Date(Date.now() - minutes * 60_000) })
            .where(eq(messagesTable.id, messageId));
    }

    it("updates the content and sets editedAt", async () => {
        const { driverId, conversationId, message } =
            await conversationWithMessage();

        const edited = await ChatService.editMessage(
            conversationId,
            message.id,
            driverId,
            "edited content"
        );

        expect(edited.content).toBe("edited content");
        expect(edited.editedAt).toBeInstanceOf(Date);

        const [reloaded] = await ChatService.getMessages(
            conversationId,
            driverId,
            50
        );
        expect(reloaded.content).toBe("edited content");
    });

    it("rejects editing someone else's message", async () => {
        const { passengerId, conversationId, message } =
            await conversationWithMessage();

        await expect(
            ChatService.editMessage(
                conversationId,
                message.id,
                passengerId,
                "hijacked"
            )
        ).rejects.toMatchObject({ code: ChatErrorCodes.NotMessageSender });
    });

    it("rejects a non-participant (IDOR guard)", async () => {
        const { conversationId, message } = await conversationWithMessage();
        const outsider = await createTestUser();

        await expect(
            ChatService.editMessage(
                conversationId,
                message.id,
                outsider.id,
                "nope"
            )
        ).rejects.toMatchObject({ code: ChatErrorCodes.NotAParticipant });
    });

    it("rejects an unknown message and an empty body", async () => {
        const { driverId, conversationId, message } =
            await conversationWithMessage();

        await expect(
            ChatService.editMessage(
                conversationId,
                crypto.randomUUID(),
                driverId,
                "whatever"
            )
        ).rejects.toMatchObject({ code: ChatErrorCodes.MessageNotFound });

        await expect(
            ChatService.editMessage(conversationId, message.id, driverId, "   ")
        ).rejects.toMatchObject({ code: ChatErrorCodes.MessageEmpty });
    });

    it("rejects editing after the 15-minute window", async () => {
        const { driverId, conversationId, message } =
            await conversationWithMessage();
        await backdateMessage(message.id, 16);

        await expect(
            ChatService.editMessage(
                conversationId,
                message.id,
                driverId,
                "too late"
            )
        ).rejects.toMatchObject({
            code: ChatErrorCodes.MessageWindowExpired,
        });
    });

    it("rejects editing a deleted message", async () => {
        const { driverId, conversationId, message } =
            await conversationWithMessage();
        await ChatService.deleteMessage(conversationId, message.id, driverId);

        await expect(
            ChatService.editMessage(
                conversationId,
                message.id,
                driverId,
                "resurrect"
            )
        ).rejects.toMatchObject({ code: ChatErrorCodes.MessageNotFound });
    });
});

describe("ChatService.deleteMessage", () => {
    async function conversationWithMessage() {
        const { driverId, passengerId, bookingId } = await bookingChatContext();
        const conversationId = await ChatService.getOrCreateConversation(
            bookingId,
            driverId
        );
        const message = await ChatService.sendMessage(
            conversationId,
            driverId,
            "to be deleted"
        );
        return { driverId, passengerId, conversationId, message };
    }

    it("tombstones the message: deletedAt set, content masked everywhere", async () => {
        const { driverId, passengerId, conversationId, message } =
            await conversationWithMessage();

        const deleted = await ChatService.deleteMessage(
            conversationId,
            message.id,
            driverId
        );
        expect(deleted.deletedAt).toBeInstanceOf(Date);
        expect(deleted.content).toBe("");

        // The tombstone still appears in the thread, masked.
        const thread = await ChatService.getMessages(
            conversationId,
            passengerId,
            50
        );
        const tombstone = thread.find((m) => m.id === message.id);
        expect(tombstone).toBeDefined();
        expect(tombstone!.content).toBe("");
        expect(tombstone!.deletedAt).toBeInstanceOf(Date);
    });

    it("is idempotent — re-deleting returns the existing tombstone", async () => {
        const { driverId, conversationId, message } =
            await conversationWithMessage();

        const first = await ChatService.deleteMessage(
            conversationId,
            message.id,
            driverId
        );
        const second = await ChatService.deleteMessage(
            conversationId,
            message.id,
            driverId
        );
        expect(second.deletedAt!.getTime()).toBe(first.deletedAt!.getTime());
    });

    it("rejects deleting someone else's message and after the window", async () => {
        const { driverId, passengerId, conversationId, message } =
            await conversationWithMessage();

        await expect(
            ChatService.deleteMessage(conversationId, message.id, passengerId)
        ).rejects.toMatchObject({ code: ChatErrorCodes.NotMessageSender });

        await db
            .update(messagesTable)
            .set({ sentAt: new Date(Date.now() - 16 * 60_000) })
            .where(eq(messagesTable.id, message.id));

        await expect(
            ChatService.deleteMessage(conversationId, message.id, driverId)
        ).rejects.toMatchObject({
            code: ChatErrorCodes.MessageWindowExpired,
        });
    });

    it("keeps a deleted last message as the masked inbox preview and out of unread", async () => {
        const { driverId, passengerId, conversationId, message } =
            await conversationWithMessage();

        await ChatService.deleteMessage(conversationId, message.id, driverId);

        const inbox = await ChatService.getConversations(passengerId);
        const item = inbox.find((c) => c.id === conversationId)!;
        expect(item.lastMessage?.id).toBe(message.id);
        expect(item.lastMessage?.content).toBe("");
        expect(item.lastMessage?.deletedAt).toBeInstanceOf(Date);
        // Deleted messages never count as unread for the counterpart.
        expect(item.unreadCount).toBe(0);
    });
});
