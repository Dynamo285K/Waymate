import { z } from "zod";
import { UserIdSchema } from "./user.schema";
import { CountryCodeSchema } from "./country-code.schema";
import { carColors } from "./status-values";
import {
    CAR_SEATS_MAX,
    CAR_SEATS_MIN,
    PLATE_MAX_LENGTH,
    PLATE_MIN_LENGTH,
    PLATE_REGEX,
} from "./validation";

export const CarIdSchema = z.uuid();
export type CarId = z.infer<typeof CarIdSchema>;

export const CarModelIdSchema = z.number().int().positive();
export type CarModelId = z.infer<typeof CarModelIdSchema>;

const CarPlateSchema = z
    .string()
    .trim()
    .toUpperCase()
    .min(PLATE_MIN_LENGTH)
    .max(PLATE_MAX_LENGTH)
    .regex(PLATE_REGEX, "Plate can contain only letters and numbers");

export type CarPlate = z.infer<typeof CarPlateSchema>;

export const CarModelSchema = z.object({
    id: CarModelIdSchema,
    brand: z.string().trim().min(1).max(100),
    modelName: z.string().trim().min(1).max(100),
});

export const CarBrandNameListSchema = z.array(
    z.object({ brand: z.string().min(1) })
);

export const CarBrandParamsSchema = z.object({
    brand: z.string().min(1),
});

export const CarSchema = z.object({
    id: CarIdSchema,
    ownerId: UserIdSchema,
    modelId: CarModelIdSchema,
    spz: CarPlateSchema,
    countryCode: CountryCodeSchema,
    color: z.enum(carColors).nullable(),
    seatsTotal: z.number().int().gt(0),
    isActive: z.boolean().default(true),
    createdAt: z.date(),
    updatedAt: z.date(),
    deletedAt: z.date().nullable(),
});

export const CarListItemSchema = z.object({
    id: CarIdSchema,
    ownerId: UserIdSchema,
    modelId: CarModelIdSchema,

    brand: z.string().trim().min(1).max(100),
    modelName: z.string().trim().min(1).max(100),

    spz: CarPlateSchema,
    countryCode: CountryCodeSchema,
    color: z.enum(carColors).nullable(),
    seatsTotal: z.number().int().gt(0),
    isActive: z.boolean(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

export const CreateCarBodySchema = z.object({
    modelId: CarModelIdSchema,
    spz: CarPlateSchema,
    countryCode: CountryCodeSchema.default("SK"),
    color: z.enum(carColors),
    seatsTotal: z
        .number()
        .int()
        .min(CAR_SEATS_MIN)
        .max(CAR_SEATS_MAX)
        .default(4),
});

export const CarIdParamsSchema = z.object({
    id: CarIdSchema,
});

export const UpdateCarStatusBodySchema = z.object({
    isActive: z.boolean(),
});

// DELETE /cars/:id acknowledges the soft-delete by echoing the id only, matching
// the lightweight `{ id }` shape used by the other delete endpoints (e.g.
// AdminDeleteReviewResponse) rather than returning the full deleted entity.
export const DeleteCarResponseSchema = z.object({
    id: CarIdSchema,
});

// Output API types (REQUEST PAYLOADS)
export type CreateCarBody = z.infer<typeof CreateCarBodySchema>;
export type CarIdParams = z.infer<typeof CarIdParamsSchema>;
export type UpdateCarStatusBody = z.infer<typeof UpdateCarStatusBodySchema>;
export type DeleteCarResponse = z.infer<typeof DeleteCarResponseSchema>;
