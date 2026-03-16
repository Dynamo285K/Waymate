import { z } from "zod";
import { CarModelEntitySchema } from "./car-model.schema";

export const CarModelOutputSchema = CarModelEntitySchema.pick({
    id: true,
    brand: true,
    model_name: true,
});

export type CarModelOutput = z.infer<typeof CarModelOutputSchema>;
