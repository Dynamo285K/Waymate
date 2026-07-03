import { useGetNotificationsUnreadCount } from "../../../api-client/notifications/notifications";
import { useSession } from "../../../lib/use-session";

/**
 * Unread notification count for the navbar bell badge. The cache is kept live
 * by the app-wide socket (`useChatSocket` invalidates it on every incoming
 * `notification` event), so this hook only reads.
 */
export function useNotificationsUnreadCount(): number {
    const { data: session } = useSession();
    const enabled = Boolean(session?.user);

    const { data } = useGetNotificationsUnreadCount({ query: { enabled } });

    return data?.count ?? 0;
}
