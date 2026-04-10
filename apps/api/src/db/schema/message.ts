import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { conversations } from "./conversation";
import { users } from "./user";
import { messageTypeEnum } from "./enums";

export const messages = pgTable(
    "messages",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        conversationId: uuid("conversation_id")
            .notNull()
            .references(() => conversations.id),
        senderId: uuid("sender_id")
            .notNull()
            .references(() => users.id),
        messageType: messageTypeEnum("message_type").notNull(),
        content: text("content").notNull(),
        sentAt: timestamp("sent_at").notNull(),
        editedAt: timestamp("edited_at"),
        deletedAt: timestamp("deleted_at"),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at").defaultNow().notNull(),
    },
    (table) => [
        index("messages_conversation_id_idx").on(table.conversationId),
        index("messages_sender_id_idx").on(table.senderId),
        index("messages_sent_at_idx").on(table.sentAt),
    ]
);
