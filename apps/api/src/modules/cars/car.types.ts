import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import type { cars } from "../../db/schema/car";
import type { carModels } from "../../db/schema/car_model";

// ==========================================
// 1. BASE DATABASE TYPES (SELECT)
// ==========================================
export type Car = InferSelectModel<typeof cars>;
export type CarModel = InferSelectModel<typeof carModels>;

// ==========================================
// 2. DATABASE TYPES FOR INSERTION (INSERT)
// ==========================================
export type CarInsert = InferInsertModel<typeof cars>;

// ==========================================
// 3. COMPOSITE TYPES (SERVICE / REPOSITORY)
// ==========================================
export type CarListItem = Omit<Car, "deletedAt"> & {
    brand: string;
    modelName: string;
};
