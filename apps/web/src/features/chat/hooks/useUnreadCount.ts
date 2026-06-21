import { useGetConversations } from "../../../api-client/chat/chat";
import { authClient } from "../../../lib/auth-client";

/**
 * Total unread messages across all of the signed-in user's conversations, for
 * the navbar chat badge. The cache it reads is kept live by the single app-wide
 * socket (`ChatSocketConnection` in the root route) — this hook only reads, so
 * mounting it per-navbar costs nothing beyond a shared, deduped query.
 */
export function useUnreadCount(): number {
    const { data: session } = authClient.useSession();
    const enabled = Boolean(session?.user);

    const { data } = useGetConversations({ query: { enabled } });

    return (data ?? []).reduce((sum, c) => sum + (c.unreadCount ?? 0), 0);
}
