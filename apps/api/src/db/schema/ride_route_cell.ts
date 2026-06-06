import {
    pgTable,
    uuid,
    varchar,
    doublePrecision,
    integer,
} from "drizzle-orm/pg-core";
import { rides } from "./ride";

export const rideRouteCells = pgTable("ride_route_cells", {
    id: uuid("id").primaryKey().defaultRandom(),
    rideId: uuid("ride_id")
        .notNull()
        .references(() => rides.id, { onDelete: "cascade" }),
    h3Res7: varchar("h3_res7", { length: 15 }).notNull(),
    lat: doublePrecision("lat").notNull(),
    lng: doublePrecision("lng").notNull(),
    pointOrder: integer("point_order").notNull(),
});
