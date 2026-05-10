import { sql } from "drizzle-orm";
import { check, index, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { rides } from "./ride";
import { users } from "./user";
import { rideStatusEnum } from "./enums";
import { timestamptz } from "./timestamps";

export const rideStatusHistory = pgTable(
    "ride_status_history",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        rideId: uuid("ride_id")
            .notNull()
            .references(() => rides.id),
        oldStatus: rideStatusEnum("old_status"),
        newStatus: rideStatusEnum("new_status").notNull(),
        changedByUserId: uuid("changed_by_user_id").references(() => users.id),
        reason: text("reason"),
        createdAt: timestamptz("created_at").defaultNow().notNull(),
    },
    (table) => [
        index("ride_status_history_ride_id_idx").on(table.rideId),
        index("ride_status_history_new_status_idx").on(table.newStatus),
        index("ride_status_history_created_at_idx").on(table.createdAt),

        check(
            "ride_status_history_reason_len_chk",
            sql`${table.reason} IS NULL OR char_length(${table.reason}) <= 500`
        ),
    ]
);
