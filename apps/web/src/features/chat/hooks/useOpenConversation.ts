import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
    usePostConversations,
    getGetConversationsQueryKey,
} from "../../../api-client/chat/chat";

type ChatPath = "/driver/chat" | "/passenger/chat";

/**
 * Opens (or reuses) the conversation for a booking and navigates to the chat
 * page with that conversation pre-selected. Backs the "Send message" action on
 * booking / passenger cards. The POST is idempotent server-side, so tapping it
 * again just reopens the existing thread.
 */
export function useOpenConversation(chatPath: ChatPath) {
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
            }
        );
    };

    return { openConversation, isPending: mutation.isPending };
}
