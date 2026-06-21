import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import type { cars } from "../../db/schema/car";
import type { carModels } from "../../db/schema/car_model";

export type Car = InferSelectModel<typeof cars>;
export type CarModel = InferSelectModel<typeof carModels>;

export type CarInsert = InferInsertModel<typeof cars>;

export type CarListItem = Omit<Car, "deletedAt"> & {
    brand: string;
    modelName: string;
};
