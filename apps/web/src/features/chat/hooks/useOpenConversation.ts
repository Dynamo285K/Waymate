import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
    usePostConversations,
    getGetConversationsQueryKey,
} from "../../../api-client/chat/chat";
import { getErrorI18nKey } from "../../../lib/api-errors";

type ChatPath = "/driver/chat" | "/passenger/chat";

// Map the chat-specific BE error codes that POST /conversations can surface to
// page copy; anything else falls back to the generic chat.openError key.
const openConversationErrorMap: Record<string, string> = {
    // You blocked them — actionable, point them at unblocking.
    CHAT_BLOCKED: "chat.openBlocked",
    // They blocked you — not actionable and invisible in your block list, so
    // say so plainly instead of implying unblocking will help.
    CHAT_BLOCKED_BY_OTHER: "chat.openBlockedByOther",
    // The other user's account is banned — there's no one to reach.
    CHAT_RECIPIENT_BANNED: "chat.openRecipientBanned",
};

/**
 * Opens (or reuses) the conversation for a booking and navigates to the chat
 * page with that conversation pre-selected. Backs the "Send message" action on
 * booking / passenger cards. The POST is idempotent server-side, so tapping it
 * again just reopens the existing thread.
 */
export function useOpenConversation(chatPath: ChatPath) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const mutation = usePostConversations();

    const openConversation = (bookingId: string) => {
        mutation.mutate(
            { data: { bookingId } },
            {
                onSuccess: ({ id }) => {
                    // Refetch the inbox so a freshly created conversation is
                    // present when the chat page derives the active thread.
                    void queryClient.invalidateQueries({
                        queryKey: getGetConversationsQueryKey(),
                    });
                    void navigate({
                        to: chatPath,
                        search: { conversation: id },
                    });
                },
                // Without this the request would fail silently — the user taps
                // "Send message" and nothing happens (no redirect, no feedback).
                onError: (error) =>
                    toast.error(
                        t(
                            getErrorI18nKey(
                                error,
                                openConversationErrorMap,
                                "chat.openError"
                            )
                        )
                    ),
            }
        );
    };

    return { openConversation, isPending: mutation.isPending };
}
