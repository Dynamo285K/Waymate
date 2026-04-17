import { z } from "zod";
import { UserIdSchema } from "../users/user.schema";
import { CountryCodeSchema } from "../../shared";
import { carColors } from "../../shared/status-values";

export const CarIdSchema = z.uuid();
export type CarId = z.infer<typeof CarIdSchema>;

export const CarModelIdSchema = z.number().int().positive();

export type CarModelId = z.infer<typeof CarModelIdSchema>;

const CarPlateSchema = z
    .string()
    .trim()
    .toUpperCase()
    .min(2)
    .max(12)
    .regex(/^[A-Z0-9]+$/, "Plate can contain only letters and numbers");

export type CarPlate = z.infer<typeof CarPlateSchema>;

export const CarModelSchema = z.object({
    id: CarModelIdSchema,
    brand: z.string().trim().min(1).max(100),
    modelName: z.string().trim().min(1).max(100),
});

export const CarSchema = z.object({
    id: CarIdSchema,
    ownerId: UserIdSchema,
    modelId: CarModelIdSchema,
    spz: CarPlateSchema,
    countryCode: CountryCodeSchema,
    color: z.enum(carColors),
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
    color: z.enum(carColors),
    seatsTotal: z.number().int().gt(0),
    isActive: z.boolean(),
    createdAt: z.date(),
    updatedAt: z.date(),
    deletedAt: z.date().nullable(),
});

export const CreateCarBodySchema = z.object({
    modelId: CarModelIdSchema,
    spz: CarPlateSchema,
    countryCode: CountryCodeSchema.default("SK"),
    color: z.enum(carColors),
    seatsTotal: z.number().int().min(2).max(9).default(4),
});

export const CarIdParamsSchema = z.object({
    id: CarIdSchema,
});

export const UpdateCarStatusBodySchema = z.object({
    isActive: z.boolean(),
});
export type Car = z.infer<typeof CarSchema>;
export type CarListItem = z.infer<typeof CarListItemSchema>;
export type CarModel = z.infer<typeof CarModelSchema>;
export type CreateCarBody = z.infer<typeof CreateCarBodySchema>;
export type CarIdParams = z.infer<typeof CarIdParamsSchema>;
export type UpdateCarStatusBody = z.infer<typeof UpdateCarStatusBodySchema>;
