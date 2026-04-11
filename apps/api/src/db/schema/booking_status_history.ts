import { sql } from "drizzle-orm";
import {
    check,
    index,
    pgTable,
    text,
    timestamp,
    uuid,
} from "drizzle-orm/pg-core";
import { bookings } from "./booking";
import { users } from "./user";
import { bookingStatusEnum } from "./enums";

export const bookingStatusHistory = pgTable(
    "booking_status_history",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        bookingId: uuid("booking_id")
            .notNull()
            .references(() => bookings.id),
        oldStatus: bookingStatusEnum("old_status"),
        newStatus: bookingStatusEnum("new_status").notNull(),
        changedByUserId: uuid("changed_by_user_id").references(() => users.id),
        reason: text("reason"),
        createdAt: timestamp("created_at").defaultNow().notNull(),
    },
    (table) => [
        index("booking_status_history_booking_id_idx").on(table.bookingId),
        index("booking_status_history_new_status_idx").on(table.newStatus),
        index("booking_status_history_created_at_idx").on(table.createdAt),

        check(
            "booking_status_history_reason_len_chk",
            sql`${table.reason} IS NULL OR char_length(${table.reason}) <= 500`
        ),
    ]
);
