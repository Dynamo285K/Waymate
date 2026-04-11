import {
    check,
    index,
    integer,
    pgTable,
    text,
    timestamp,
    uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./user";
import { cars } from "./car";
import { rideStatusEnum } from "./enums";

export const rides = pgTable(
    "rides",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        driverId: uuid("driver_id")
            .notNull()
            .references(() => users.id),
        carId: uuid("car_id")
            .notNull()
            .references(() => cars.id),
        departureAt: timestamp("departure_at").notNull(),
        arrivalEstimateAt: timestamp("arrival_estimate_at"),
        rideStatus: rideStatusEnum("ride_status").notNull(),
        offeredSeats: integer("offered_seats").notNull(),
        currency: text("currency").notNull(),
        description: text("description"),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at").defaultNow().notNull(),
        deletedAt: timestamp("deleted_at"),
    },
    (table) => [
        index("rides_driver_id_idx").on(table.driverId),
        index("rides_car_id_idx").on(table.carId),
        index("rides_departure_at_idx").on(table.departureAt),
        index("rides_status_idx").on(table.rideStatus),
        index("rides_offered_seats_idx").on(table.offeredSeats),
        index("rides_created_at_idx").on(table.createdAt),

        check("rides_offered_seats_chk", sql`${table.offeredSeats} > 0`),
        check(
            "rides_arrival_after_departure_chk",
            sql`${table.arrivalEstimateAt} IS NULL OR ${table.arrivalEstimateAt} >= ${table.departureAt}`
        ),
        check("rides_currency_chk", sql`${table.currency} ~ '^[A-Z]{3}$'`),
        check(
            "rides_description_len_chk",
            sql`${table.description} IS NULL OR char_length(${table.description}) <= 500`
        ),
    ]
);
