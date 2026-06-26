import { describe, it, expect, vi, afterEach } from "vitest";
import { ChatRealtime } from "./chat.realtime";
import { ChatService } from "./chat.service";
import type { Message } from "@repo/shared";
import { createRideContext, createTestUser } from "../../../test/factories";

const sampleMessage: Message = {
    id: crypto.randomUUID(),
    conversationId: crypto.randomUUID(),
    senderId: crypto.randomUUID(),
    messageType: "TEXT",
    content: "hi",
    sentAt: new Date(),
    editedAt: null,
};

afterEach(() => {
    // The broadcaster is module-global; reset it so tests don't leak state.
    ChatRealtime.setBroadcaster(null);
    vi.restoreAllMocks();
});

describe("ChatRealtime.userTopic", () => {
    it("namespaces per user", () => {
        const id = crypto.randomUUID();
        expect(ChatRealtime.userTopic(id)).toBe(`chat:user:${id}`);
    });
});

describe("ChatRealtime.notifyMessage", () => {
    it("publishes the message event to both participants' topics", () => {
        const publish = vi.fn();
        ChatRealtime.setBroadcaster({ publish });

        const driverId = crypto.randomUUID();
        const passengerId = crypto.randomUUID();
        ChatRealtime.notifyMessage(
            driverId,
            passengerId,
            sampleMessage.conversationId,
            sampleMessage
        );

        expect(publish).toHaveBeenCalledTimes(2);
        const topics = publish.mock.calls.map((c) => c[0]);
        expect(topics).toEqual(
            expect.arrayContaining([
                ChatRealtime.userTopic(driverId),
                ChatRealtime.userTopic(passengerId),
            ])
        );

        const payload = JSON.parse(publish.mock.calls[0]![1] as string);
        expect(payload.type).toBe("message");
        expect(payload.conversationId).toBe(sampleMessage.conversationId);
        expect(payload.message.id).toBe(sampleMessage.id);
    });

    it("is a no-op when no broadcaster is wired (e.g. in tests)", () => {
        // No setBroadcaster call — publishing must not throw.
        expect(() =>
            ChatRealtime.notifyMessage(
                crypto.randomUUID(),
                crypto.randomUUID(),
                sampleMessage.conversationId,
                sampleMessage
            )
        ).not.toThrow();
    });

    it("swallows a broadcaster failure rather than propagating it", () => {
        const publish = vi.fn(() => {
            throw new Error("socket exploded");
        });
        ChatRealtime.setBroadcaster({ publish });

        expect(() =>
            ChatRealtime.notifyMessage(
                crypto.randomUUID(),
                crypto.randomUUID(),
                sampleMessage.conversationId,
                sampleMessage
            )
        ).not.toThrow();
    });
});

describe("ChatRealtime.notifyRead", () => {
    it("publishes a read event to the counterpart only", () => {
        const publish = vi.fn();
        ChatRealtime.setBroadcaster({ publish });

        const counterpartId = crypto.randomUUID();
        const readerId = crypto.randomUUID();
        const conversationId = crypto.randomUUID();
        const at = new Date();

        ChatRealtime.notifyRead(counterpartId, conversationId, readerId, at);

        expect(publish).toHaveBeenCalledTimes(1);
        expect(publish.mock.calls[0]![0]).toBe(
            ChatRealtime.userTopic(counterpartId)
        );
        const payload = JSON.parse(publish.mock.calls[0]![1] as string);
        expect(payload).toMatchObject({
            type: "read",
            conversationId,
            userId: readerId,
        });
    });
});

describe("ChatService.sendMessage realtime wiring (integration)", () => {
    it("broadcasts a committed message to both participants and no one else", async () => {
        const ctx = await createRideContext({ withPassenger: true });
        const driverId = ctx.driver.id;
        const passengerId = ctx.passenger!.id;
        const outsider = await createTestUser();

        const publish = vi.fn();
        ChatRealtime.setBroadcaster({ publish });

        const conversationId = await ChatService.getOrCreateConversation(
            ctx.bookingId!,
            driverId
        );
        await ChatService.sendMessage(conversationId, driverId, "hello");

        const topics = publish.mock.calls.map((c) => c[0]);
        expect(topics).toContain(ChatRealtime.userTopic(driverId));
        expect(topics).toContain(ChatRealtime.userTopic(passengerId));
        expect(topics).not.toContain(ChatRealtime.userTopic(outsider.id));
    });
});
