import { z } from "zod";
import { UserIdSchema } from "../users/user.schema";
import { CountryCodeSchema } from "../../shared";
import { carColors } from "../../shared/status-values";

export const CarIdSchema = z.uuid();
export type CarId = z.infer<typeof CarIdSchema>;

export const CarModelIdSchema = z.number().int().positive();
export type CarModelId = z.infer<typeof CarModelIdSchema>;

export const CarModelEntitySchema = z.object({
    id: CarModelIdSchema,
    brand: z.string().trim().min(1).max(100),
    modelName: z.string().trim().min(1).max(100),
});

export const CarEntitySchema = z.object({
    id: CarIdSchema,
    ownerId: UserIdSchema,
    modelId: CarModelIdSchema,
    spz: z.string().min(1).max(16),
    countryCode: CountryCodeSchema,
    color: z.enum(carColors).nullable(),
    seatsTotal: z.number().int().gt(0),
    isActive: z.boolean(),
    createdAt: z.date(),
    updatedAt: z.date(),
    deletedAt: z.date().nullable(),
});

export const CreateCarBodySchema = z.object({
    modelId: CarModelIdSchema,
    spz: z.string().min(2).max(16).transform(val => val.toUpperCase()), // automaticky zmení na VEĽKÉ
    countryCode: z.string().min(1).max(5).default("SK"),
    color: z.enum(carColors).nullable(),
    seatsTotal: z.number().int().min(2).max(9).default(4),
});


export type Car = z.infer<typeof CarEntitySchema>;
export type CarModelEntity = z.infer<typeof CarModelEntitySchema>;