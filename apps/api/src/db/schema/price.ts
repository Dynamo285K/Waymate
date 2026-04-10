import {
    check,
    index,
    numeric,
    pgTable,
    text,
    timestamp,
    uniqueIndex,
    uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { rides } from "./ride";
import { rideStops } from "./ride_stop";

export const prices = pgTable(
    "prices",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        rideId: uuid("ride_id")
            .notNull()
            .references(() => rides.id),
        startStopId: uuid("start_stop_id")
            .notNull()
            .references(() => rideStops.id),
        endStopId: uuid("end_stop_id")
            .notNull()
            .references(() => rideStops.id),
        amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
        currency: text("currency").notNull(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at").defaultNow().notNull(),
    },
    (table) => [
        uniqueIndex("prices_ride_start_end_uq").on(table.rideId, table.startStopId, table.endStopId),
        index("prices_start_stop_id_idx").on(table.startStopId),
        index("prices_end_stop_id_idx").on(table.endStopId),
        
        check("prices_amount_non_negative_chk", sql`${table.amount} >= 0`),
        check("prices_distinct_stops_chk", sql`${table.startStopId} <> ${table.endStopId}`),
        check("prices_currency_chk", sql`${table.currency} ~ '^[A-Z]{3}$'`),
    ]
);