import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useTranslation } from "react-i18next";
import { useNavigate } from "@tanstack/react-router";
import { useGetNotifications } from "../../../api-client/notifications/notifications";
import type { Notification } from "../../../api-client/model/notification";
import { useLayout } from "../../../lib/use-layout";
import { useSession } from "../../../lib/use-session";
import { formatRelativeTime } from "../../../lib/date-format";
import { useNotificationsUnreadCount } from "../hooks/useNotificationsUnreadCount";
import { useMarkNotificationRead } from "../hooks/useMarkNotificationRead";
import { useMarkAllNotificationsRead } from "../hooks/useMarkAllNotificationsRead";
import { localizeNotification } from "../lib/notification-i18n";
import { notificationTargetPath } from "../lib/notification-navigation";

// @waymate/ui ships no bell icon (checked v0.1.63), so this stays inline.
function BellIcon() {
    return (
        <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
    );
}

/**
 * Navbar notification bell: unread badge on the trigger, dropdown with the
 * latest notifications, mark-all-read, and per-item click that marks the
 * notification read and navigates to the relevant page. The unread count and
 * list caches are kept live by the app-wide socket.
 */
export function NotificationBell() {
    const { t } = useTranslation();
    const { theme } = useLayout();
    const navigate = useNavigate();
    const { data: session } = useSession();
    const enabled = Boolean(session?.user);

    const { data: notifications } = useGetNotifications(
        { limit: 20 },
        { query: { enabled } }
    );
    const unreadCount = useNotificationsUnreadCount();
    const markRead = useMarkNotificationRead();
    const markAllRead = useMarkAllNotificationsRead();

    const handleItemClick = (notification: Notification) => {
        if (!notification.readAt) {
            markRead.mutate({ id: notification.id });
        }
        void navigate({ to: notificationTargetPath(notification) });
    };

    return (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger
                className="relative inline-flex border-0 bg-transparent p-0 cursor-pointer"
                aria-label={t("notifications.bellAria")}
            >
                <span className="w-8 h-8 rounded-full bg-card text-text-secondary shadow-button inline-flex items-center justify-center hover:bg-border">
                    <BellIcon />
                </span>
                {unreadCount > 0 && (
                    <span
                        className="absolute -top-1 -right-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red px-1 text-badge font-bold leading-none text-white"
                        aria-label={t("notifications.unreadBadgeAria", {
                            count: unreadCount,
                        })}
                    >
                        {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                )}
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
                <DropdownMenu.Content
                    className="z-200"
                    sideOffset={16}
                    align="end"
                    data-theme={theme}
                >
                    <div className="w-80 rounded-summary-card overflow-hidden bg-card border border-border shadow-dropdown-strong">
                        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border">
                            <span className="text-text-primary font-semibold">
                                {t("notifications.title")}
                            </span>
                            {unreadCount > 0 && (
                                <button
                                    type="button"
                                    className="text-caption font-semibold text-primary hover:underline cursor-pointer border-0 bg-transparent p-0"
                                    onClick={() => markAllRead.mutate()}
                                >
                                    {t("notifications.markAllRead")}
                                </button>
                            )}
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                            {(notifications ?? []).length === 0 ? (
                                <p className="px-4 py-6 text-center text-text-secondary text-caption">
                                    {t("notifications.empty")}
                                </p>
                            ) : (
                                (notifications ?? []).map((notification) => {
                                    const { title, body } =
                                        localizeNotification(t, notification);
                                    return (
                                        <DropdownMenu.Item
                                            key={notification.id}
                                            className={`block w-full px-4 py-3 border-b border-border last:border-b-0 cursor-pointer outline-none data-highlighted:bg-border ${
                                                notification.readAt
                                                    ? ""
                                                    : "bg-primary-tint"
                                            }`}
                                            onSelect={() =>
                                                handleItemClick(notification)
                                            }
                                        >
                                            <span className="flex items-start justify-between gap-2">
                                                <span className="text-text-primary text-caption font-semibold">
                                                    {title}
                                                </span>
                                                <span className="shrink-0 text-text-secondary text-badge">
                                                    {formatRelativeTime(
                                                        notification.createdAt
                                                    )}
                                                </span>
                                            </span>
                                            <span className="mt-0.5 block text-text-secondary text-caption">
                                                {body}
                                            </span>
                                        </DropdownMenu.Item>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    );
}
