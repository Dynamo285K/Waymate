import { z } from "zod";
import { CarIdSchema } from "./car-id.schema";
import { UserIdSchema } from "../users/user-id.schema";
import { CountryCodeSchema } from "../../shared";

export const CarEntitySchema = z.object({
    // Identity and ownership
    id: CarIdSchema,
    owner_id: UserIdSchema,
    model_id: z.number().int(),

    // Vehicle details
    spz: z.string().min(1).max(16),
    country_code: CountryCodeSchema,
    color: z.string().min(1).max(50).nullable(),
    seats_total: z.number().int().gt(0),
    is_active: z.boolean(),

    // Timestamps
    created_at: z.date(),
    updated_at: z.date(),
    deleted_at: z.date().nullable(),
});

export type Car = z.infer<typeof CarEntitySchema>;
