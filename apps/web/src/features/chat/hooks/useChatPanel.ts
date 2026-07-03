import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
    useGetConversations,
    useGetConversationsByIdMessages,
    getConversationsByIdMessages,
    usePostConversationsByIdMessages,
    usePatchConversationsByIdMessagesByMessageId,
    useDeleteConversationsByIdMessagesByMessageId,
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
import type { Message } from "../../../api-client/model/message";
import { useSession } from "../../../lib/use-session";
import {
    applyMessageToCache,
    applyMessageUpdateToCache,
    clearUnreadInCache,
} from "../../../lib/chat-cache";
import { getErrorI18nKey } from "../../../lib/api-errors";
import { formatShortDate, formatTime } from "../../../lib/date-format";

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
    isEdited: boolean;
    isDeleted: boolean;
    // Own TEXT message, not deleted, still inside the 15-minute modify window
    // (mirror of the server rule — the API re-checks on every call).
    canModify: boolean;
};

export type ChatPanel = {
    conversations: ConversationView[];
    isLoadingConversations: boolean;
    activeId: string | null;
    activeName: string | null;
    activeRideLabel: string | null;
    activeCounterpartId: string | null;
    activeRideId: string | null;
    isCounterpartBlockedByMe: boolean;
    isThreadBlocked: boolean;
    isActiveCounterpartBanned: boolean;
    messages: MessageView[];
    isLoadingMessages: boolean;
    hasOlderMessages: boolean;
    isLoadingOlder: boolean;
    loadOlderMessages: () => void;
    isSending: boolean;
    isBlocking: boolean;
    isUnblocking: boolean;
    selectConversation: (id: string) => void;
    clearSelection: () => void;
    sendMessage: (text: string) => void;
    editMessage: (messageId: string, text: string) => void;
    deleteMessage: (messageId: string) => void;
    blockUser: (userId: string) => void;
    unblockActive: () => void;
    // Jump from the thread to its ride — drivers land on the ride's passenger
    // list, passengers on their rides. Null when the thread has no ride.
    openActiveRide: (() => void) | null;
};

// Mirror of the server-side modify window (chat.service.ts) — used only to
// decide whether to show the edit/delete actions.
const MESSAGE_MODIFY_WINDOW_MS = 15 * 60 * 1000;

// Matches the server default; passed explicitly so the has-more heuristic
// ("a full page means there may be more") is deterministic.
const MESSAGES_PAGE_SIZE = 50;

// Older pages accumulated below the socket-live base query. Keyed by
// conversation so switching threads needs no reset effect (the strict
// react-hooks rules forbid setState-in-effect) — state for another
// conversation is simply ignored at render time.
type OlderMessagesState = {
    conversationId: string;
    messages: Message[];
    hasMore: boolean;
};

function counterpartName(item: ConversationListItem, fallback: string): string {
    const name = [item.counterpart.firstName, item.counterpart.lastName]
        .filter(Boolean)
        .join(" ")
        .trim();
    return name || fallback;
}

// Threads are ride-scoped, so the same counterpart can appear several times in
// the inbox — label each thread with the counterpart's role and the ride's
// route + departure ("Řidič · Náchod → Brno 12. 7."). The inbox mixes both of
// the user's roles (the passenger and driver chat pages show the same list),
// so the role tag says who the counterpart is on that ride. The label goes
// into the sidebar's PREVIEW line, not the name: the Avatar derives initials
// from the name string (first + last word), so a suffix would render initials
// like "A7".
function rideLabel(
    item: ConversationListItem,
    t: (key: string) => string
): string | null {
    // The counterpart plays the opposite role to mine on this ride.
    const counterpartRole = t(
        item.myRole === "DRIVER" ? "roles.passenger" : "roles.driver"
    );
    if (!item.rideOriginCity || !item.rideDestinationCity) {
        return counterpartRole;
    }
    const date = item.rideDepartureAt
        ? ` ${formatShortDate(item.rideDepartureAt)}`
        : "";
    return `${counterpartRole} · ${item.rideOriginCity} → ${item.rideDestinationCity}${date}`;
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
        { limit: MESSAGES_PAGE_SIZE },
        { query: { enabled: Boolean(activeId) } }
    );

    const [older, setOlder] = useState<OlderMessagesState | null>(null);
    const [isLoadingOlder, setIsLoadingOlder] = useState(false);

    const olderForActive =
        older && older.conversationId === activeId ? older : null;
    const basePage = messagesQuery.data ?? [];

    // A full base page means history may continue past it; once an older fetch
    // comes back short, the thread start has been reached.
    const hasOlderMessages =
        basePage.length === MESSAGES_PAGE_SIZE &&
        (olderForActive ? olderForActive.hasMore : true);

    const loadOlderMessages = () => {
        if (!activeId || isLoadingOlder || !hasOlderMessages) return;
        const cursor = olderForActive?.messages[0] ?? basePage[0];
        if (!cursor) return;

        setIsLoadingOlder(true);
        getConversationsByIdMessages(activeId, {
            limit: MESSAGES_PAGE_SIZE,
            before: cursor.sentAt,
            beforeId: cursor.id,
        })
            .then((fetched) => {
                setOlder((prev) => ({
                    conversationId: activeId,
                    messages: [
                        ...fetched,
                        // Only keep previous pages if they belong to the same
                        // conversation — a stale prev for another thread would
                        // interleave histories.
                        ...(prev && prev.conversationId === activeId
                            ? prev.messages
                            : []),
                    ],
                    hasMore: fetched.length === MESSAGES_PAGE_SIZE,
                }));
            })
            .catch(() => {
                // Leave state untouched; the top sentinel stays visible so the
                // user can retry by scrolling.
            })
            .finally(() => setIsLoadingOlder(false));
    };

    const sendMutation = usePostConversationsByIdMessages();
    const editMutation = usePatchConversationsByIdMessagesByMessageId();
    const deleteMutation = useDeleteConversationsByIdMessagesByMessageId();
    const readMutation = usePatchConversationsByIdRead();
    const blockMutation = usePostBlocks();
    const unblockMutation = useDeleteBlocksByBlockedUserId();
    const blocksQuery = useGetBlocks();
    const blockedIds = new Set(
        (blocksQuery.data ?? []).map((b) => b.blockedUser.id)
    );

    const unknownUser = t("chat.unknownUser");
    // The sidebar's secondary line shows the thread's identity (counterpart
    // role + ride route/date), NOT a last-message preview — with ride-scoped
    // threads, knowing WHICH ride matters more than the latest text.
    const conversations: ConversationView[] = (
        conversationsQuery.data ?? []
    ).map((item) => ({
        id: item.id,
        name: counterpartName(item, unknownUser),
        lastMessage: rideLabel(item, t) ?? "",
        unreadCount: item.unreadCount,
        blocked: item.isBlocked,
    }));

    const activeConversation = (conversationsQuery.data ?? []).find(
        (c) => c.id === activeId
    );
    // Plain counterpart name for people-centric surfaces (header avatar,
    // profile/report/block modals); the ride tag lives in the sidebar preview.
    const activeName = activeConversation
        ? counterpartName(activeConversation, unknownUser)
        : null;
    const activeRideLabel = activeConversation
        ? rideLabel(activeConversation, t)
        : null;
    const activeCounterpartId = activeConversation?.counterpart.id ?? null;
    const activeRideId = activeConversation?.rideId ?? null;
    const isCounterpartBlockedByMe = activeCounterpartId
        ? blockedIds.has(activeCounterpartId)
        : false;
    const isThreadBlocked = activeConversation?.isBlocked ?? false;
    const isActiveCounterpartBanned =
        activeConversation?.counterpartBanned ?? false;

    // Older pages precede the base page and never overlap it (they're strictly
    // before the cursor), but dedupe by id anyway — a refetched base page could
    // in principle reach back into an already-loaded older page.
    const seenIds = new Set<string>();
    const messages: MessageView[] = [
        ...(olderForActive?.messages ?? []),
        ...basePage,
    ]
        .filter((m) => {
            if (seenIds.has(m.id)) return false;
            seenIds.add(m.id);
            return true;
        })
        .map((m) => {
            const isMine = m.senderId === userId;
            const isDeleted = m.deletedAt != null;
            return {
                id: m.id,
                message: m.content,
                time: formatTime(new Date(m.sentAt)),
                sentAt: m.sentAt,
                variant: isMine ? ("outgoing" as const) : ("incoming" as const),
                isEdited: m.editedAt != null,
                isDeleted,
                canModify:
                    isMine &&
                    !isDeleted &&
                    m.messageType === "TEXT" &&
                    Date.now() - new Date(m.sentAt).getTime() <
                        MESSAGE_MODIFY_WINDOW_MS,
            };
        });

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

    // Own edits/deletes must also fix the locally accumulated older pages —
    // the cache helper only reaches the base query. (A counterpart's update of
    // a message living only in the older pages won't live-update; it corrects
    // on thread reopen — accepted limitation.)
    const applyUpdateLocally = (message: Message) => {
        applyMessageUpdateToCache(queryClient, message.conversationId, message);
        setOlder((prev) =>
            prev
                ? {
                      ...prev,
                      messages: prev.messages.map((m) =>
                          m.id === message.id ? message : m
                      ),
                  }
                : prev
        );
    };

    const modifyErrorToast = (error: unknown) =>
        toast.error(
            t(
                getErrorI18nKey(
                    error,
                    { CHAT_MESSAGE_WINDOW_EXPIRED: "chat.windowExpired" },
                    "errors.unknown"
                )
            )
        );

    const editMessage = (messageId: string, text: string) => {
        const content = text.trim();
        if (!content || !activeId) return;
        editMutation.mutate(
            { id: activeId, messageId, data: { content } },
            { onSuccess: applyUpdateLocally, onError: modifyErrorToast }
        );
    };

    const deleteMessage = (messageId: string) => {
        if (!activeId) return;
        deleteMutation.mutate(
            { id: activeId, messageId },
            { onSuccess: applyUpdateLocally, onError: modifyErrorToast }
        );
    };

    // Threads are ride-scoped, so the header can link straight to the ride.
    // The driver's passengers page reads the ride from history state (see
    // lib/router-state.ts); passengers have no ride-detail page, so they land
    // on their rides list.
    const openActiveRide =
        activeConversation?.rideId != null
            ? () => {
                  if (activeConversation.myRole === "DRIVER") {
                      void navigate({
                          to: "/driver/rides/passengers",
                          state: {
                              ride: {
                                  id: activeConversation.rideId!,
                                  from: activeConversation.rideOriginCity ?? "",
                                  to:
                                      activeConversation.rideDestinationCity ??
                                      "",
                                  datetime:
                                      activeConversation.rideDepartureAt ??
                                      undefined,
                              },
                          },
                      });
                  } else {
                      void navigate({ to: "/passenger/rides" });
                  }
              }
            : null;

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
        activeRideLabel,
        activeCounterpartId,
        activeRideId,
        isCounterpartBlockedByMe,
        isThreadBlocked,
        isActiveCounterpartBanned,
        messages,
        isLoadingMessages: Boolean(activeId) && messagesQuery.isLoading,
        hasOlderMessages,
        isLoadingOlder,
        loadOlderMessages,
        isSending: sendMutation.isPending,
        isBlocking: blockMutation.isPending,
        isUnblocking: unblockMutation.isPending,
        selectConversation: (id: string) => setConversationParam(id),
        clearSelection: () => setConversationParam(undefined),
        sendMessage,
        editMessage,
        deleteMessage,
        blockUser,
        unblockActive,
        openActiveRide,
    };
}
