import { sql } from "drizzle-orm";
import { check, index, pgTable, uuid } from "drizzle-orm/pg-core";
import { rides } from "./ride";
import { bookings } from "./booking";
import { conversationTypeEnum } from "./enums";
import { timestamptz } from "./timestamps";

export const conversations = pgTable(
    "conversations",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        rideId: uuid("ride_id").references(() => rides.id),
        bookingId: uuid("booking_id").references(() => bookings.id),
        conversationType: conversationTypeEnum("conversation_type").notNull(),
        driverLastReadAt: timestamptz("driver_last_read_at"),
        passengerLastReadAt: timestamptz("passenger_last_read_at"),
        createdAt: timestamptz("created_at").defaultNow().notNull(),
        updatedAt: timestamptz("updated_at").defaultNow().notNull(),
        deletedAt: timestamptz("deleted_at"),
    },
    (table) => [
        index("conversations_ride_id_idx").on(table.rideId),
        index("conversations_booking_id_idx").on(table.bookingId),
        index("conversations_type_idx").on(table.conversationType),
        index("conversations_updated_at_idx").on(table.updatedAt),

        check(
            "conversations_context_present_chk",
            sql`${table.rideId} IS NOT NULL OR ${table.bookingId} IS NOT NULL`
        ),
    ]
);
