import {
    check,
    index,
    integer,
    numeric,
    pgTable,
    text,
    timestamp,
    uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./user";
import { rides } from "./ride";
import { rideStops } from "./ride_stop";
import { bookingStatusEnum } from "./enums";

export const bookings = pgTable(
    "bookings",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        passengerId: uuid("passenger_id")
            .notNull()
            .references(() => users.id),
        rideId: uuid("ride_id")
            .notNull()
            .references(() => rides.id),
        pickupStopId: uuid("pickup_stop_id")
            .notNull()
            .references(() => rideStops.id),
        dropoffStopId: uuid("dropoff_stop_id")
            .notNull()
            .references(() => rideStops.id),
        seatCount: integer("seat_count").notNull(),
        bookingStatus: bookingStatusEnum("booking_status").notNull(),
        priceAmount: numeric("price_amount", {
            precision: 10,
            scale: 2,
        }).notNull(),
        currency: text("currency").notNull(),
        confirmedAt: timestamp("confirmed_at"),
        cancelledAt: timestamp("cancelled_at"),
        cancelledByUserId: uuid("cancelled_by_user_id").references(
            () => users.id
        ),
        cancellationReason: text("cancellation_reason"),
        noShowMarkedAt: timestamp("no_show_marked_at"),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at").defaultNow().notNull(),
        deletedAt: timestamp("deleted_at"),
    },
    (table) => [
        index("bookings_passenger_id_idx").on(table.passengerId),
        index("bookings_ride_id_idx").on(table.rideId),
        index("bookings_pickup_stop_id_idx").on(table.pickupStopId),
        index("bookings_dropoff_stop_id_idx").on(table.dropoffStopId),
        index("bookings_status_idx").on(table.bookingStatus),
        index("bookings_created_at_idx").on(table.createdAt),

        check(
            "bookings_distinct_stops_chk",
            sql`${table.pickupStopId} <> ${table.dropoffStopId}`
        ),
        check("bookings_seat_count_chk", sql`${table.seatCount} > 0`),
        check(
            "bookings_price_non_negative_chk",
            sql`${table.priceAmount} >= 0`
        ),
        check("bookings_currency_chk", sql`${table.currency} ~ '^[A-Z]{3}$'`),
        check(
            "bookings_cancellation_reason_len_chk",
            sql`${table.cancellationReason} IS NULL OR char_length(${table.cancellationReason}) <= 500`
        ),
    ]
);
