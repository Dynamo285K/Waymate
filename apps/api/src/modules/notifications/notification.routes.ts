import { Elysia } from "elysia";
import { NotificationService } from "./notification.service";
import { isFullyOnboarded } from "../auth/auth.middleware";
import {
    ErrorResponseSchema,
    NotificationIdParamsSchema,
    NotificationListSchema,
    NotificationReadResponseSchema,
    NotificationsQuerySchema,
    NotificationsReadAllResponseSchema,
    UnreadCountResponseSchema,
} from "@repo/shared";

export const NotificationRoutes = new Elysia({
    prefix: "/notifications",
    tags: ["Notifications"],
})
    .model({
        NotificationIdParams: NotificationIdParamsSchema,
        NotificationsQuery: NotificationsQuerySchema,
        NotificationList: NotificationListSchema,
        UnreadCountResponse: UnreadCountResponseSchema,
        NotificationReadResponse: NotificationReadResponseSchema,
        NotificationsReadAllResponse: NotificationsReadAllResponseSchema,
        ErrorResponse: ErrorResponseSchema,
    })
    .use(isFullyOnboarded)
    .guard({ auth: true, onboarded: true }, (app) =>
        app
            .get(
                "/",
                async ({ user, query }) =>
                    await NotificationService.listForUser(
                        user.id,
                        query.limit,
                        query.before,
                        query.beforeId
                    ),
                {
                    query: NotificationsQuerySchema,
                    response: {
                        200: "NotificationList",
                        429: "ErrorResponse",
                        500: "ErrorResponse",
                    },
                    detail: {
                        description:
                            "Returns the authenticated user's notifications (newest first), optionally paginated with a `before` cursor",
                    },
                }
            )

            .get(
                "/unread-count",
                async ({ user }) =>
                    await NotificationService.getUnreadCount(user.id),
                {
                    response: {
                        200: "UnreadCountResponse",
                        429: "ErrorResponse",
                        500: "ErrorResponse",
                    },
                    detail: {
                        description:
                            "Returns how many of the authenticated user's notifications are unread",
                    },
                }
            )

            .patch(
                "/read-all",
                async ({ user }) =>
                    await NotificationService.markAllRead(user.id),
                {
                    response: {
                        200: "NotificationsReadAllResponse",
                        429: "ErrorResponse",
                        500: "ErrorResponse",
                    },
                    detail: {
                        description:
                            "Marks all of the authenticated user's notifications as read; returns how many were updated",
                    },
                }
            )

            .patch(
                "/:id/read",
                async ({ user, params }) =>
                    await NotificationService.markRead(params.id, user.id),
                {
                    params: NotificationIdParamsSchema,
                    response: {
                        200: "NotificationReadResponse",
                        404: "ErrorResponse",
                        429: "ErrorResponse",
                        500: "ErrorResponse",
                    },
                    detail: {
                        description:
                            "Marks a single notification as read. Idempotent — re-reading returns the existing readAt",
                    },
                }
            )
    );
