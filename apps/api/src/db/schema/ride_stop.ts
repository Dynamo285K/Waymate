import {
    check,
    doublePrecision,
    index,
    integer,
    pgTable,
    text,
    uniqueIndex,
    uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { rides } from "./ride";
import { countryCodeEnum } from "./enums";
import { timestamptz } from "./timestamps";

export const rideStops = pgTable(
    "ride_stops",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        rideId: uuid("ride_id")
            .notNull()
            .references(() => rides.id),
        address: text("address").notNull(),
        city: text("city").notNull(),
        countryCode: countryCodeEnum("country_code"),
        lat: doublePrecision("lat").notNull(),
        lng: doublePrecision("lng").notNull(),
        stopOrder: integer("stop_order").notNull(),
        plannedArrivalAt: timestamptz("planned_arrival_at"),
        plannedDepartureAt: timestamptz("planned_departure_at"),
        createdAt: timestamptz("created_at").defaultNow().notNull(),
        updatedAt: timestamptz("updated_at").defaultNow().notNull(),
    },
    (table) => [
        uniqueIndex("ride_stops_ride_id_stop_order_uq").on(
            table.rideId,
            table.stopOrder
        ),
        index("ride_stops_city_idx").on(table.city),
        index("ride_stops_country_code_idx").on(table.countryCode),
        index("ride_stops_lat_idx").on(table.lat),
        index("ride_stops_lng_idx").on(table.lng),

        check("ride_stops_stop_order_chk", sql`${table.stopOrder} >= 0`),
        check("ride_stops_lat_chk", sql`${table.lat} BETWEEN -90 AND 90`),
        check("ride_stops_lng_chk", sql`${table.lng} BETWEEN -180 AND 180`),
        check(
            "ride_stops_address_len_chk",
            sql`char_length(${table.address}) BETWEEN 1 AND 255`
        ),
        check(
            "ride_stops_city_len_chk",
            sql`char_length(${table.city}) BETWEEN 1 AND 100`
        ),
        check(
            "ride_stops_planned_time_order_chk",
            sql`${table.plannedArrivalAt} IS NULL OR ${table.plannedDepartureAt} IS NULL OR ${table.plannedDepartureAt} >= ${table.plannedArrivalAt}`
        ),
    ]
);
