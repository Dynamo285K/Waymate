import { sql } from "drizzle-orm";
import { check, index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./user";
import { userStatusEnum } from "./enums";

export const userStatusHistory = pgTable(
    "user_status_history",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        userId: uuid("user_id")
            .notNull()
            .references(() => users.id),
        oldStatus: userStatusEnum("old_status"),
        newStatus: userStatusEnum("new_status").notNull(),
        changedByUserId: uuid("changed_by_user_id").references(() => users.id),
        reason: text("reason"),
        createdAt: timestamp("created_at").defaultNow().notNull(),
    },
    (table) => [
        index("user_status_history_user_id_idx").on(table.userId),
        index("user_status_history_new_status_idx").on(table.newStatus),
        index("user_status_history_created_at_idx").on(table.createdAt),

        check("user_status_history_reason_len_chk", sql`${table.reason} IS NULL OR char_length(${table.reason}) <= 500`)
    ]
);