import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
    useGetConversations,
    useGetConversationsByIdMessages,
    usePostConversationsByIdMessages,
    usePatchConversationsByIdRead,
    getGetConversationsQueryKey,
} from "../../../api-client/chat/chat";
import {
    usePostBlocks,
    useGetBlocks,
    useDeleteBlocksByBlockedUserId,
    getGetBlocksQueryKey,
} from "../../../api-client/blocks/blocks";
import type { ConversationListItem } from "../../../api-client/model/conversationListItem";
import { useSession } from "../../../lib/use-session";
import {
    applyMessageToCache,
    clearUnreadInCache,
} from "../../../lib/chat-cache";
import { formatTime } from "../../../lib/date-format";

export type ConversationView = {
    id: string;
    name: string;
    lastMessage: string;
    unreadCount: number;
    blocked: boolean;
};

export type MessageView = {
    id: string;
    message: string;
    time: string;
    sentAt: string;
    variant: "incoming" | "outgoing";
};

export type ChatPanel = {
    conversations: ConversationView[];
    isLoadingConversations: boolean;
    activeId: string | null;
    activeName: string | null;
    activeCounterpartId: string | null;
    activeRideId: string | null;
    isCounterpartBlockedByMe: boolean;
    isThreadBlocked: boolean;
    isActiveCounterpartBanned: boolean;
    messages: MessageView[];
    isLoadingMessages: boolean;
    isSending: boolean;
    isBlocking: boolean;
    isUnblocking: boolean;
    selectConversation: (id: string) => void;
    clearSelection: () => void;
    sendMessage: (text: string) => void;
    blockUser: (userId: string) => void;
    unblockActive: () => void;
};

function counterpartName(item: ConversationListItem, fallback: string): string {
    const name = [item.counterpart.firstName, item.counterpart.lastName]
        .filter(Boolean)
        .join(" ")
        .trim();
    return name || fallback;
}

/**
 * Drives the chat UI for both driver and passenger audiences: lists the
 * authenticated user's conversations, loads the selected thread, sends
 * messages, and marks the open conversation read. Realtime delivery is handled
 * by `useChatSocket`, which keeps the underlying query caches live — this hook
 * just reads from them and maps to view models the UI components consume.
 */
export function useChatPanel(initialConversationId?: string | null): ChatPanel {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const { data: session } = useSession();
    const userId = session?.user?.id;

    // The live socket runs app-wide from the navbar (see useUnreadCount); the
    // panel just reads the caches it keeps fresh.
    const conversationsQuery = useGetConversations();

    // The open conversation lives entirely in the URL (`?conversation=<id>`):
    // it's deep-linkable, survives the chat page already being mounted, and lets
    // a booking's "Send message" button target a thread by navigating. So there
    // is no local selection state to keep in sync with the prop.
    const activeId = initialConversationId ?? null;
    const setConversationParam = (id: string | undefined) =>
        void navigate({
            to: ".",
            search: (prev) => ({ ...prev, conversation: id }),
        });

    const messagesQuery = useGetConversationsByIdMessages(
        activeId ?? "",
        {},
        { query: { enabled: Boolean(activeId) } }
    );

    const sendMutation = usePostConversationsByIdMessages();
    const readMutation = usePatchConversationsByIdRead();
    const blockMutation = usePostBlocks();
    const unblockMutation = useDeleteBlocksByBlockedUserId();
    const blocksQuery = useGetBlocks();
    const blockedIds = new Set(
        (blocksQuery.data ?? []).map((b) => b.blockedUser.id)
    );

    const unknownUser = t("chat.unknownUser");
    const conversations: ConversationView[] = (
        conversationsQuery.data ?? []
    ).map((item) => ({
        id: item.id,
        name: counterpartName(item, unknownUser),
        lastMessage: item.lastMessage?.content ?? "",
        unreadCount: item.unreadCount,
        blocked: item.isBlocked,
    }));

    const activeConversation = (conversationsQuery.data ?? []).find(
        (c) => c.id === activeId
    );
    const activeName = activeConversation
        ? counterpartName(activeConversation, unknownUser)
        : null;
    const activeCounterpartId = activeConversation?.counterpart.id ?? null;
    const activeRideId = activeConversation?.rideId ?? null;
    const isCounterpartBlockedByMe = activeCounterpartId
        ? blockedIds.has(activeCounterpartId)
        : false;
    const isThreadBlocked = activeConversation?.isBlocked ?? false;
    const isActiveCounterpartBanned =
        activeConversation?.counterpartBanned ?? false;

    const messages: MessageView[] = (messagesQuery.data ?? []).map((m) => ({
        id: m.id,
        message: m.content,
        time: formatTime(new Date(m.sentAt)),
        sentAt: m.sentAt,
        variant: m.senderId === userId ? "outgoing" : "incoming",
    }));

    // Mark the open conversation read whenever it changes or a new message
    // lands in it. The mutate fn is held in a ref so this effect only re-fires
    // on those two signals, not on every render.
    const latestMessageId = messages.at(-1)?.id ?? null;
    const readMutateRef = useRef(readMutation.mutate);
    useEffect(() => {
        readMutateRef.current = readMutation.mutate;
    });
    useEffect(() => {
        if (!activeId) return;
        readMutateRef.current(
            { id: activeId },
            { onSuccess: () => clearUnreadInCache(queryClient, activeId) }
        );
    }, [activeId, latestMessageId, queryClient]);

    const sendMessage = (text: string) => {
        const content = text.trim();
        if (!content || !activeId) return;
        sendMutation.mutate(
            { id: activeId, data: { content } },
            {
                // Reflect the sent message immediately; the socket echo dedupes
                // against it by id.
                onSuccess: (message) =>
                    applyMessageToCache(queryClient, activeId, message, userId),
            }
        );
    };

    const refreshBlockState = () => {
        void queryClient.invalidateQueries({
            queryKey: getGetConversationsQueryKey(),
        });
        void queryClient.invalidateQueries({
            queryKey: getGetBlocksQueryKey(),
        });
    };

    // Block the counterpart from the chat header. We stay in the thread so the
    // blocked state is visible (banner + disabled composer); refreshing the
    // blocks query flips `isActiveBlocked`.
    const blockUser = (blockedUserId: string) => {
        blockMutation.mutate(
            { data: { blockedUserId, reason: "OTHER" } },
            { onSuccess: refreshBlockState }
        );
    };

    const unblockActive = () => {
        if (!activeCounterpartId) return;
        unblockMutation.mutate(
            { blockedUserId: activeCounterpartId },
            { onSuccess: refreshBlockState }
        );
    };

    return {
        conversations,
        isLoadingConversations: conversationsQuery.isLoading,
        activeId,
        activeName,
        activeCounterpartId,
        activeRideId,
        isCounterpartBlockedByMe,
        isThreadBlocked,
        isActiveCounterpartBanned,
        messages,
        isLoadingMessages: Boolean(activeId) && messagesQuery.isLoading,
        isSending: sendMutation.isPending,
        isBlocking: blockMutation.isPending,
        isUnblocking: unblockMutation.isPending,
        selectConversation: (id: string) => setConversationParam(id),
        clearSelection: () => setConversationParam(undefined),
        sendMessage,
        blockUser,
        unblockActive,
    };
}
