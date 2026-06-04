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
import { cities } from "./city";
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
        countryCode: text("country_code").notNull(),
        h3Res7: text("h3_res7").notNull(),
        h3Res8: text("h3_res8").notNull(),
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
        index("ride_stops_lat_idx").on(table.lat),
        index("ride_stops_lng_idx").on(table.lng),
        index("ride_stops_h3_res7_idx").on(table.h3Res7),
        index("ride_stops_h3_res8_idx").on(table.h3Res8),

        check("ride_stops_stop_order_chk", sql`${table.stopOrder} >= 0`),
        check("ride_stops_lat_chk", sql`${table.lat} BETWEEN -90 AND 90`),
        check("ride_stops_lng_chk", sql`${table.lng} BETWEEN -180 AND 180`),
        check(
            "ride_stops_address_len_chk",
            sql`char_length(${table.address}) BETWEEN 1 AND 255`
        ),
        check(
            "ride_stops_planned_time_order_chk",
            sql`${table.plannedArrivalAt} IS NULL OR ${table.plannedDepartureAt} IS NULL OR ${table.plannedDepartureAt} >= ${table.plannedArrivalAt}`
        ),
    ]
);
