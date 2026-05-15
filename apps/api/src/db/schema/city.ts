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
import { countryCodeEnum } from "./enums";
import { timestamptz } from "./timestamps";

export const cities = pgTable(
    "cities",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        // GeoNames numeric id — anchor for idempotent re-seeds via
        // ON CONFLICT (external_id) DO UPDATE.
        externalId: integer("external_id").notNull(),
        name: text("name").notNull(),
        // Lowercase, diacritics-stripped form ("zilina"). Computed in JS
        // at seed time so the search query stays a plain ILIKE without
        // depending on the unaccent extension.
        nameNormalized: text("name_normalized").notNull(),
        countryCode: countryCodeEnum("country_code").notNull(),
        lat: doublePrecision("lat").notNull(),
        lng: doublePrecision("lng").notNull(),
        population: integer("population").notNull().default(0),
        createdAt: timestamptz("created_at").defaultNow().notNull(),
        updatedAt: timestamptz("updated_at").defaultNow().notNull(),
    },
    (table) => [
        uniqueIndex("cities_external_id_uq").on(table.externalId),
        uniqueIndex("cities_name_normalized_country_code_uq").on(
            table.nameNormalized,
            table.countryCode
        ),
        index("cities_country_code_idx").on(table.countryCode),
        index("cities_population_idx").on(table.population),

        check(
            "cities_name_len_chk",
            sql`char_length(${table.name}) BETWEEN 1 AND 200`
        ),
        check(
            "cities_name_normalized_len_chk",
            sql`char_length(${table.nameNormalized}) BETWEEN 1 AND 200`
        ),
        check("cities_lat_chk", sql`${table.lat} BETWEEN -90 AND 90`),
        check("cities_lng_chk", sql`${table.lng} BETWEEN -180 AND 180`),
        check("cities_population_chk", sql`${table.population} >= 0`),
    ]
);
