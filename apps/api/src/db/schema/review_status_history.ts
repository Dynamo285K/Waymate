import { sql } from "drizzle-orm";
import {
    check,
    index,
    pgTable,
    text,
    timestamp,
    uuid,
} from "drizzle-orm/pg-core";
import { reviews } from "./review";
import { users } from "./user";
import { reviewStatusEnum } from "./enums";

export const reviewStatusHistory = pgTable(
    "review_status_history",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        reviewId: uuid("review_id")
            .notNull()
            .references(() => reviews.id),
        oldStatus: reviewStatusEnum("old_status"),
        newStatus: reviewStatusEnum("new_status").notNull(),
        changedByUserId: uuid("changed_by_user_id").references(() => users.id),
        reason: text("reason"),
        createdAt: timestamp("created_at").defaultNow().notNull(),
    },
    (table) => [
        index("review_status_history_review_id_idx").on(table.reviewId),
        index("review_status_history_new_status_idx").on(table.newStatus),
        index("review_status_history_created_at_idx").on(table.createdAt),

        check(
            "review_status_history_reason_len_chk",
            sql`${table.reason} IS NULL OR char_length(${table.reason}) <= 500`
        ),
    ]
);
