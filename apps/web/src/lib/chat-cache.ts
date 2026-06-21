import type { QueryClient } from "@tanstack/react-query";
import {
    getGetConversationsQueryKey,
    getGetConversationsByIdMessagesQueryKey,
} from "../api-client/chat/chat";
import type { Message } from "../api-client/model/message";
import type { ConversationList } from "../api-client/model/conversationList";

// Merges a single message into the TanStack Query caches that back the chat UI:
// the conversation's message thread and the inbox list. Shared by the realtime
// socket (incoming broadcasts) and the send mutation (the message the current
// user just posted) so both paths stay consistent and dedupe against each other
// by message id.
//
// Returns `true` when the conversation was found in the inbox cache; `false`
// means the caller should refetch the list (e.g. a brand-new conversation).
export function applyMessageToCache(
    queryClient: QueryClient,
    conversationId: string,
    message: Message,
    currentUserId: string | undefined
): boolean {
    // Append to every cached page of this conversation's thread, deduping by id
    // and keeping ascending (oldest-first) order.
    queryClient.setQueriesData<Message[]>(
        { queryKey: getGetConversationsByIdMessagesQueryKey(conversationId) },
        (current) => {
            if (!current) return current;
            if (current.some((m) => m.id === message.id)) return current;
            return [...current, message].sort((a, b) =>
                a.sentAt < b.sentAt ? -1 : a.sentAt > b.sentAt ? 1 : 0
            );
        }
    );

    // Bump the conversation in the inbox: newest message, unread for the
    // recipient, reordered to the top.
    let found = false;
    queryClient.setQueryData<ConversationList>(
        getGetConversationsQueryKey(),
        (list) => {
            if (!list) return list;
            const idx = list.findIndex((c) => c.id === conversationId);
            if (idx === -1) return list;
            found = true;
            const item = list[idx];
            const fromMe = message.senderId === currentUserId;
            const updated = {
                ...item,
                lastMessage: message,
                updatedAt: message.sentAt,
                unreadCount: fromMe ? item.unreadCount : item.unreadCount + 1,
            };
            return [updated, ...list.slice(0, idx), ...list.slice(idx + 1)];
        }
    );

    return found;
}

// Clears the unread badge for a conversation in the inbox cache — used after the
// current user marks it read, since the server only broadcasts the read receipt
// to the counterpart, not back to the reader.
export function clearUnreadInCache(
    queryClient: QueryClient,
    conversationId: string
): void {
    queryClient.setQueryData<ConversationList>(
        getGetConversationsQueryKey(),
        (list) =>
            list?.map((c) =>
                c.id === conversationId ? { ...c, unreadCount: 0 } : c
            )
    );
}
