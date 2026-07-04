import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetConversationsQueryKey } from "../../api-client/chat/chat";
import {
    getGetNotificationsQueryKey,
    getGetNotificationsUnreadCountQueryKey,
} from "../../api-client/notifications/notifications";
import type { Message } from "../../api-client/model/message";
import type { Notification } from "../../api-client/model/notification";
import { API_BASE_URL } from "../../lib/api-fetcher";
import { useSession } from "../../lib/use-session";
import {
    applyMessageToCache,
    applyMessageUpdateToCache,
} from "../../lib/chat-cache";

// Server -> client events pushed over `GET /conversations/ws`. Dates arrive as
// JSON strings, matching the orval-generated models used in the query cache
// (the backend's @repo/shared union types them as `Date` — don't import that
// here or cache writes won't line up).
export type ChatMessageEvent = {
    type: "message";
    conversationId: string;
    message: Message;
};

export type ChatReadEvent = {
    type: "read";
    conversationId: string;
    userId: string;
    lastReadAt: string;
};

export type ChatMessageUpdatedEvent = {
    type: "message-updated";
    conversationId: string;
    message: Message;
};

export type NotificationEvent = {
    type: "notification";
    notification: Notification;
};

export type ChatSocketEvent =
    | ChatMessageEvent
    | ChatReadEvent
    | ChatMessageUpdatedEvent
    | NotificationEvent;

type UseChatSocketOptions = {
    // Defaults to "connect while signed in". Pass false to hold the socket
    // closed (e.g. on routes where chat isn't relevant).
    enabled?: boolean;
    // Fires for every event after the cache has been updated, so callers can
    // react to things the cache doesn't model (e.g. counterpart read receipts).
    onEvent?: (event: ChatSocketEvent) => void;
};

const RECONNECT_BASE_MS = 1_000;
const RECONNECT_MAX_MS = 30_000;

function chatSocketUrl(): string {
    const httpBase = API_BASE_URL.startsWith("http")
        ? API_BASE_URL
        : `${window.location.origin}${API_BASE_URL}`;
    return `${httpBase.replace(/^http/, "ws")}/conversations/ws`;
}

function isChatSocketEvent(value: unknown): value is ChatSocketEvent {
    if (!value || typeof value !== "object") return false;
    const type = (value as { type?: unknown }).type;
    return (
        type === "message" ||
        type === "read" ||
        type === "message-updated" ||
        type === "notification"
    );
}

/**
 * Subscribes to the chat realtime channel and keeps the TanStack Query caches
 * (`GET /conversations/` and `GET /conversations/:id/messages`) live as
 * messages arrive. Reconnects with exponential backoff while enabled, and
 * tears the socket down on unmount or sign-out.
 *
 * Sending and marking-read still go through the REST mutation hooks; this hook
 * only consumes the broadcasts those writes produce.
 */
export function useChatSocket(options: UseChatSocketOptions = {}): void {
    const { onEvent } = options;
    const { data: session } = useSession();
    const userId = session?.user?.id;
    const enabled = options.enabled ?? Boolean(userId);

    const queryClient = useQueryClient();

    // Keep the latest callback / user id in refs so the connection effect only
    // re-runs when `enabled` or the user actually changes — not on every render.
    const onEventRef = useRef(onEvent);
    const userIdRef = useRef(userId);
    useEffect(() => {
        onEventRef.current = onEvent;
        userIdRef.current = userId;
    });

    useEffect(() => {
        if (!enabled || typeof window === "undefined") return;

        let socket: WebSocket | null = null;
        let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
        let attempts = 0;
        let closedByEffect = false;

        const handleEvent = (event: ChatSocketEvent) => {
            if (event.type === "message") {
                const found = applyMessageToCache(
                    queryClient,
                    event.conversationId,
                    event.message,
                    userIdRef.current
                );
                // A message for a conversation we haven't loaded yet (e.g. one
                // just opened by the counterpart): refetch the inbox so it
                // shows up.
                if (!found) {
                    void queryClient.invalidateQueries({
                        queryKey: getGetConversationsQueryKey(),
                    });
                }
            } else if (event.type === "message-updated") {
                applyMessageUpdateToCache(
                    queryClient,
                    event.conversationId,
                    event.message
                );
                // A deletion can change the unread count server-side (deleted
                // messages never count) — refetch the inbox to stay exact.
                if (event.message.deletedAt) {
                    void queryClient.invalidateQueries({
                        queryKey: getGetConversationsQueryKey(),
                    });
                }
            } else if (event.type === "notification") {
                // Refetch rather than patch: the list is cursor-paginated and
                // cheap, and the badge must stay exact.
                void queryClient.invalidateQueries({
                    queryKey: getGetNotificationsQueryKey(),
                });
                void queryClient.invalidateQueries({
                    queryKey: getGetNotificationsUnreadCountQueryKey(),
                });
            }
            // `read` events carry the counterpart's progress, which the cache
            // doesn't model — forward to the consumer only.
            onEventRef.current?.(event);
        };

        const scheduleReconnect = () => {
            if (closedByEffect) return;
            const delay = Math.min(
                RECONNECT_BASE_MS * 2 ** attempts,
                RECONNECT_MAX_MS
            );
            attempts += 1;
            reconnectTimer = setTimeout(connect, delay);
        };

        const connect = () => {
            if (closedByEffect) return;
            socket = new WebSocket(chatSocketUrl());

            socket.onopen = () => {
                attempts = 0;
            };

            socket.onmessage = (evt) => {
                try {
                    const parsed: unknown = JSON.parse(evt.data as string);
                    if (isChatSocketEvent(parsed)) handleEvent(parsed);
                } catch {
                    // Ignore malformed frames rather than crashing the socket.
                }
            };

            socket.onclose = () => {
                socket = null;
                scheduleReconnect();
            };

            socket.onerror = () => {
                // Let `onclose` (which always follows) drive reconnection.
                socket?.close();
            };
        };

        connect();

        return () => {
            closedByEffect = true;
            if (reconnectTimer) clearTimeout(reconnectTimer);
            socket?.close();
            socket = null;
        };
    }, [enabled, userId, queryClient]);
}
