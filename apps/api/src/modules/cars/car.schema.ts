import { z } from "zod";
import { UserIdSchema } from "../users/user.schema";
import { CountryCodeSchema } from "../../shared";

export const CarIdSchema = z.uuid();
export type CarId = z.infer<typeof CarIdSchema>;

export const CarModelIdSchema = z.number().int().positive();
export type CarModelId = z.infer<typeof CarModelIdSchema>;

export const CarModelEntitySchema = z.object({
    // Identity
    id: CarModelIdSchema,

    // Model details
    brand: z.string().trim().min(1).max(100),
    model_name: z.string().trim().min(1).max(100),
});

export const CarModelOutputSchema = CarModelEntitySchema.pick({
    id: true,
    brand: true,
    model_name: true,
});

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

export type Car = z.infer<typeof CarEntitySchema>;
export type CarOutput = z.infer<typeof CarOutputSchema>;
export type CarModelEntity = z.infer<typeof CarModelEntitySchema>;
export type CarModelOutput = z.infer<typeof CarModelOutputSchema>;
