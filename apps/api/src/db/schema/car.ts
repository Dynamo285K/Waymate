import {
    boolean,
    check,
    index,
    integer,
    pgTable,
    text,
    timestamp,
    uniqueIndex,
    uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./user";
import { carModels } from "./car_model";
import { carColorEnum } from "./enums";

export const cars = pgTable(
    "cars",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        ownerId: uuid("owner_id")
            .notNull()
            .references(() => users.id),
        modelId: integer("model_id")
            .notNull()
            .references(() => carModels.id),
        spz: text("spz").notNull(),
        countryCode: text("country_code").notNull(),
        color: carColorEnum("color"),
        seatsTotal: integer("seats_total").notNull(),
        isActive: boolean("is_active").notNull().default(true),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at").defaultNow().notNull(),
        deletedAt: timestamp("deleted_at"),
    },
    (table) => [
        uniqueIndex("cars_spz_country_code_uq").on(
            table.spz,
            table.countryCode
        ),
        index("cars_owner_id_idx").on(table.ownerId),
        index("cars_model_id_idx").on(table.modelId),
        // Index for Country Code is not neccesary as it's part of the unique index with SPZ

        check("cars_seats_total_chk", sql`${table.seatsTotal} > 0`),
        check(
            "cars_spz_len_chk",
            sql`char_length(${table.spz}) BETWEEN 1 AND 16`
        ),
        check(
            "cars_country_code_chk",
            sql`${table.countryCode} ~ '^[A-Z]{3}$'`
        ),
    ]
);
