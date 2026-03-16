import { z } from "zod";
import { CarModelIdSchema } from "./car-model-id.schema";

export const CarModelEntitySchema = z.object({
    id: CarModelIdSchema,
    brand: z.string().trim().min(1).max(100),
    model_name: z.string().trim().min(1).max(100),
});

export type CarModelEntity = z.infer<typeof CarModelEntitySchema>;
