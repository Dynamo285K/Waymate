import { z } from "zod";
import { CarEntitySchema } from "./car.schema";

export const CarOutputSchema = CarEntitySchema.pick({
    id: true,
    owner_id: true,
    model_id: true,
    spz: true,
    country_code: true,
    color: true,
    seats_total: true,
    is_active: true,
    created_at: true,
});

export type CarOutput = z.infer<typeof CarOutputSchema>;
