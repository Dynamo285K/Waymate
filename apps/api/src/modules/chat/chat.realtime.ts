import { logger } from "../../shared/logger";
import type { ChatSocketEvent, Message } from "@repo/shared";

// Minimal slice of the Bun `Server` we depend on. The WebSocket route subscribes
// each connection to its user topic; this hub publishes events to those topics
// from outside the socket handler (i.e. from the chat service after a REST
// write commits). Publishing is in-process pub/sub — exact on a single
// instance, but each replica only reaches sockets it owns, so back this with a
// shared broker (e.g. Redis) before scaling horizontally.
type Broadcaster = {
    publish: (topic: string, data: string) => unknown;
};

let broadcaster: Broadcaster | null = null;

// Per-user topic. A connection subscribes to its own topic on open, so a user
// receives every event for every conversation they take part in — including
// ones opened after they connected — without re-subscribing.
const userTopic = (userId: string): string => `chat:user:${userId}`;

// Wire the live Bun server once the app is listening. Left unset in tests (the
// app is imported without `.listen()`), where publishing is a silent no-op.
const setBroadcaster = (server: Broadcaster | null): void => {
    broadcaster = server;
};

const publishToUser = (userId: string, event: ChatSocketEvent): void => {
    if (!broadcaster) return;
    try {
        broadcaster.publish(userTopic(userId), JSON.stringify(event));
    } catch (error) {
        logger.warn({ err: error, userId }, "chat_realtime_publish_failed");
    }
};

// Broadcast a new message to both parties. The sender's other devices get it
// too (they dedupe by message id); the REST response remains the source of
// truth for the tab that sent it.
const notifyMessage = (
    driverId: string,
    passengerId: string,
    conversationId: string,
    message: Message
): void => {
    const event: ChatSocketEvent = { type: "message", conversationId, message };
    publishToUser(driverId, event);
    publishToUser(passengerId, event);
};

// Tell the counterpart that this user has read the conversation up to now, so
// their unread badge / read receipts update live.
const notifyRead = (
    targetUserId: string,
    conversationId: string,
    userId: string,
    lastReadAt: Date
): void => {
    publishToUser(targetUserId, {
        type: "read",
        conversationId,
        userId,
        lastReadAt,
    });
};

export const ChatRealtime = {
    userTopic,
    setBroadcaster,
    notifyMessage,
    notifyRead,
};
