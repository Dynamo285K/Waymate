import { z } from "zod";
import { CarIdSchema } from "../cars/car-id.schema";
import { CurrencyInputSchema } from "../../shared";

const DescriptionInputSchema = z
    .string()
    .trim()
    .max(500) // Should be fixed in the database as well
    .nullable();

export const RideInputSchema = z
    .object({
        car_id: CarIdSchema,

        departure_at: z.date(),
        arrival_estimate_at: z.date().nullable(),

        offered_seats: z.number().int().min(1),

        currency: CurrencyInputSchema,
        description: DescriptionInputSchema,
    })
    .superRefine((input, ctx) => {
        if (
            input.arrival_estimate_at !== null &&
            input.arrival_estimate_at < input.departure_at
        ) {
            ctx.addIssue({
                code: "custom",
                path: ["arrival_estimate_at"],
                message: "arrival_estimate_at cannot be before departure_at",
            });
        }
    });

export type RideInput = z.infer<typeof RideInputSchema>;
