import { check, index, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { conversations } from "./conversation";
import { users } from "./user";
import { messageTypeEnum } from "./enums";
import { timestamptz } from "./timestamps";
import { sql } from "drizzle-orm";

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
        sentAt: timestamptz("sent_at").notNull(),
        editedAt: timestamptz("edited_at"),
        deletedAt: timestamptz("deleted_at"),
        createdAt: timestamptz("created_at").defaultNow().notNull(),
        updatedAt: timestamptz("updated_at").defaultNow().notNull(),
    },
    (table) => [
        check(
            "message_content_length_check",
            sql`char_length(${table.content}) BETWEEN 1 AND 2000`
        ),
        index("messages_conversation_sent_idx")
            .on(table.conversationId, table.sentAt.desc(), table.id.desc())
            .where(sql`${table.deletedAt} IS NULL`),
        index("messages_sender_id_idx").on(table.senderId),
        index("messages_sent_at_idx").on(table.sentAt),
    ]
);
