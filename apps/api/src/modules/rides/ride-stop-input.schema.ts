import { z } from "zod";
import { CityInputSchema, CountryCodeInputSchema } from "../../shared";

const AddressInputSchema = z.string().trim().min(1).max(255);

export const RideStopInputSchema = z
    .object({
        address: AddressInputSchema,
        city: CityInputSchema,
        country_code: CountryCodeInputSchema.nullable(),
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
        stop_order: z.number().int().min(0),
        planned_arrival_at: z.date().nullable(),
        planned_departure_at: z.date().nullable(),
    })
    .superRefine((input, ctx) => {
        if (
            input.planned_arrival_at !== null &&
            input.planned_departure_at !== null &&
            input.planned_departure_at < input.planned_arrival_at
        ) {
            ctx.addIssue({
                code: "custom",
                path: ["planned_departure_at"],
                message:
                    "planned_departure_at cannot be before planned_arrival_at",
            });
        }
    });

export type RideStopInput = z.infer<typeof RideStopInputSchema>;
