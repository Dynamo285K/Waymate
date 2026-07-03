import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useChatSocket } from "../../../hooks/shared/useChatSocket";
import { useSession } from "../../../lib/use-session";
import { localizeNotification } from "../../notifications/lib/notification-i18n";
import { notificationTargetPath } from "../../notifications/lib/notification-navigation";

// Holds the single app-wide chat WebSocket. Rendered once from the root route so
// the connection survives navigation between pages (mounting it per-page would
// tear down and reopen the socket on every route change). Renders nothing.
// Besides keeping the query caches live (done inside useChatSocket), it turns
// incoming events into toasts: every notification, and new chat messages when
// the user isn't already looking at a chat page.
export function ChatSocketConnection() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const { data: session } = useSession();
    const userId = session?.user?.id;

    useChatSocket({
        onEvent: (event) => {
            if (event.type === "notification") {
                const { title, body } = localizeNotification(
                    t,
                    event.notification
                );
                toast(title, {
                    description: body,
                    action: {
                        label: t("notifications.open"),
                        onClick: () =>
                            void navigate({
                                to: notificationTargetPath(event.notification),
                            }),
                    },
                });
            } else if (
                event.type === "message" &&
                event.message.senderId !== userId &&
                !pathname.includes("/chat")
            ) {
                toast(t("notifications.newMessage"), {
                    action: {
                        label: t("notifications.open"),
                        onClick: () =>
                            void navigate({
                                to: pathname.startsWith("/driver")
                                    ? "/driver/chat"
                                    : "/passenger/chat",
                                search: {
                                    conversation: event.conversationId,
                                },
                            }),
                    },
                });
            }
        },
    });
    return null;
}
