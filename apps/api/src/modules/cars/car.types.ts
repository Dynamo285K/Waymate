import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import type { cars } from "../../db/schema/car";
import type { carModels } from "../../db/schema/car_model";

export type Car = InferSelectModel<typeof cars>;
export type CarInsert = InferInsertModel<typeof cars>;
export type CarModel = InferSelectModel<typeof carModels>;

export type CreateCarBody = Pick<
    CarInsert,
    "modelId" | "spz" | "countryCode" | "color" | "seatsTotal"
>;

export type UpdateCarStatusBody = {
    isActive: boolean;
};

export type CarListItem = Car & Pick<CarModel, "brand" | "modelName">;
