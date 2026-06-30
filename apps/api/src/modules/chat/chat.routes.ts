import { Elysia } from "elysia";
import { ChatService } from "./chat.service";
import { ChatRealtime } from "./chat.realtime";
import { isFullyOnboarded } from "../auth/auth.middleware";
import { createErrorHandler } from "../auth/auth.errors";
import { ChatError, chatErrorToHttpStatus } from "./chat.errors";
import { logger } from "../../shared/logger";
import {
    ErrorResponseSchema,
    ConversationIdParamsSchema,
    CreateConversationBodySchema,
    SendMessageBodySchema,
    MessagesQuerySchema,
    MessageSchema,
    MessageListSchema,
    ConversationListSchema,
    ConversationActionResponseSchema,
    ConversationReadResponseSchema,
} from "@repo/shared";

export const ChatRoutes = new Elysia({
    prefix: "/conversations",
    tags: ["Chat"],
})
    .model({
        ConversationIdParams: ConversationIdParamsSchema,
        CreateConversationBody: CreateConversationBodySchema,
        SendMessageBody: SendMessageBodySchema,
        MessagesQuery: MessagesQuerySchema,
        Message: MessageSchema,
        MessageList: MessageListSchema,
        ConversationList: ConversationListSchema,
        ConversationActionResponse: ConversationActionResponseSchema,
        ConversationReadResponse: ConversationReadResponseSchema,
        ErrorResponse: ErrorResponseSchema,
    })
    .use(isFullyOnboarded)
    .guard({ auth: true, onboarded: true }, (app) =>
        app
            .onError(createErrorHandler(ChatError, chatErrorToHttpStatus))

            .get(
                "/",
                async ({ user }) => {
                    return await ChatService.getConversations(user.id);
                },
                {
                    response: {
                        200: "ConversationList",
                        429: "ErrorResponse",
                        500: "ErrorResponse",
                    },
                    detail: {
                        description:
                            "Returns all conversations the authenticated user takes part in, with the latest message and unread count",
                    },
                }
            )

            .post(
                "/",
                async ({ user, body, status }) => {
                    const conversationId =
                        await ChatService.getOrCreateConversation(
                            body.bookingId,
                            user.id
                        );
                    return status(201, { id: conversationId });
                },
                {
                    body: "CreateConversationBody",
                    response: {
                        201: "ConversationActionResponse",
                        403: "ErrorResponse",
                        404: "ErrorResponse",
                        413: "ErrorResponse",
                        429: "ErrorResponse",
                        500: "ErrorResponse",
                    },
                    detail: {
                        description:
                            "Opens (or reuses) the conversation for a booking between its driver and passenger",
                    },
                }
            )

            .get(
                "/:id/messages",
                async ({ user, params, query }) => {
                    return await ChatService.getMessages(
                        params.id,
                        user.id,
                        query.limit,
                        query.before,
                        query.beforeId
                    );
                },
                {
                    params: ConversationIdParamsSchema,
                    query: MessagesQuerySchema,
                    response: {
                        200: "MessageList",
                        403: "ErrorResponse",
                        404: "ErrorResponse",
                        429: "ErrorResponse",
                        500: "ErrorResponse",
                    },
                    detail: {
                        description:
                            "Returns messages in a conversation (oldest first), optionally paginated with a `before` cursor",
                    },
                }
            )

            .post(
                "/:id/messages",
                async ({ user, params, body, status }) => {
                    const message = await ChatService.sendMessage(
                        params.id,
                        user.id,
                        body.content
                    );
                    return status(201, message);
                },
                {
                    params: ConversationIdParamsSchema,
                    body: "SendMessageBody",
                    response: {
                        201: "Message",
                        400: "ErrorResponse",
                        403: "ErrorResponse",
                        404: "ErrorResponse",
                        413: "ErrorResponse",
                        429: "ErrorResponse",
                        500: "ErrorResponse",
                    },
                    detail: {
                        description:
                            "Sends a text message to a conversation the authenticated user takes part in",
                    },
                }
            )

            .patch(
                "/:id/read",
                async ({ user, params }) => {
                    return await ChatService.markRead(params.id, user.id);
                },
                {
                    params: ConversationIdParamsSchema,
                    response: {
                        200: "ConversationReadResponse",
                        403: "ErrorResponse",
                        404: "ErrorResponse",
                        429: "ErrorResponse",
                        500: "ErrorResponse",
                    },
                    detail: {
                        description:
                            "Marks the conversation as read up to now for the authenticated participant",
                    },
                }
            )

            // Realtime delivery channel. The upgrade is authenticated by the
            // inherited { auth, onboarded } guard via the session cookie; an
            // unauthenticated upgrade is rejected before `open`. Clients still
            // send / read messages over REST — this socket only pushes the
            // resulting `message` / `read` events (see ChatSocketEventSchema).
            .ws("/ws", {
                // A WebSocket upgrade is not a REST operation; keep it out of
                // the OpenAPI document (Scalar / orval can't model it and it
                // breaks Swagger schema validation).
                detail: { hide: true },
                open(ws) {
                    const { user } = ws.data;
                    ws.subscribe(ChatRealtime.userTopic(user.id));
                    logger.debug({ userId: user.id }, "chat_ws_open");
                },
                close(ws) {
                    const { user } = ws.data;
                    ws.unsubscribe(ChatRealtime.userTopic(user.id));
                    logger.debug({ userId: user.id }, "chat_ws_close");
                },
            })
    );
