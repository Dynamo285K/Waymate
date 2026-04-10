import { sql } from "drizzle-orm";
import {
    check,
    index,
    integer,
    pgTable,
    text,
    uniqueIndex,
} from "drizzle-orm/pg-core";

export const carModels = pgTable(
    "car_models",
    {
        id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
        brand: text("brand").notNull(),
        modelName: text("model_name").notNull(),
    },
    (table) => [
        uniqueIndex("car_models_brand_model_name_uq").on(
            table.brand,
            table.modelName
        ),
        index("car_models_model_name_idx").on(table.modelName),

        check(
            "car_models_brand_len_chk",
            sql`char_length(${table.brand}) BETWEEN 1 AND 100`
        ),
        check(
            "car_models_model_name_len_chk",
            sql`char_length(${table.modelName}) BETWEEN 1 AND 100`
        ),
    ]
);
