import { z } from "zod";
import { conversationTypeValues, messageTypeValues } from "./status-values";
import { PublicUserPreviewSchema } from "./user.schema";

export const ConversationIdParamsSchema = z.object({
    id: z.uuid("Invalid conversation ID"),
});

export const CreateConversationBodySchema = z.object({
    bookingId: z.uuid("Invalid booking ID"),
});

export const SendMessageBodySchema = z.object({
    content: z
        .string()
        .trim()
        .min(1, "Message cannot be empty")
        .max(2000, "Message is too long"),
});

export const MessagesQuerySchema = z.object({
    limit: z.coerce.number().int().min(1).max(100).default(50),
    before: z.coerce.date().optional(),
    beforeId: z.uuid().optional(),
});

export const ConversationRoleSchema = z.enum(["DRIVER", "PASSENGER"]);

export const MessageSchema = z.object({
    id: z.uuid(),
    conversationId: z.uuid(),
    senderId: z.uuid(),
    messageType: z.enum(messageTypeValues),
    content: z.string(),
    sentAt: z.date(),
    editedAt: z.date().nullable(),
});

export const MessageListSchema = MessageSchema.array();

export const ConversationListItemSchema = z.object({
    id: z.uuid(),
    conversationType: z.enum(conversationTypeValues),
    bookingId: z.uuid().nullable(),
    rideId: z.uuid().nullable(),
    myRole: ConversationRoleSchema,
    counterpart: PublicUserPreviewSchema,
    counterpartBanned: z.boolean(),
    lastMessage: MessageSchema.nullable(),
    unreadCount: z.number().int(),
    updatedAt: z.date(),
    isBlocked: z.boolean(),
});

export const ConversationListSchema = ConversationListItemSchema.array();

export const ConversationActionResponseSchema = z.object({
    id: z.uuid(),
});

export const ConversationReadResponseSchema = z.object({
    id: z.uuid(),
    lastReadAt: z.date(),
});

// Server -> client events pushed over `GET /conversations/ws`. The socket is a
// delivery channel only: clients still send messages / mark-read over REST, and
// the server broadcasts the resulting state to every participant's user topic.
export const ChatMessageEventSchema = z.object({
    type: z.literal("message"),
    conversationId: z.uuid(),
    message: MessageSchema,
});

export const ChatReadEventSchema = z.object({
    type: z.literal("read"),
    conversationId: z.uuid(),
    userId: z.uuid(),
    lastReadAt: z.date(),
});

export const ChatSocketEventSchema = z.discriminatedUnion("type", [
    ChatMessageEventSchema,
    ChatReadEventSchema,
]);

export type ConversationRole = z.infer<typeof ConversationRoleSchema>;
export type Message = z.infer<typeof MessageSchema>;
export type ConversationListItem = z.infer<typeof ConversationListItemSchema>;
export type ChatMessageEvent = z.infer<typeof ChatMessageEventSchema>;
export type ChatReadEvent = z.infer<typeof ChatReadEventSchema>;
export type ChatSocketEvent = z.infer<typeof ChatSocketEventSchema>;
