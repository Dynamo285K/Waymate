import { z } from "zod";
import { CarIdSchema } from "../../cars/schemas/car-id.schema";
import {
    CityInputSchema,
    CountryCodeInputSchema,
    CurrencyInputSchema,
} from "../../../shared/schemas";

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

        origin_city: CityInputSchema,
        destination_city: CityInputSchema,
        origin_country_code: CountryCodeInputSchema.nullable(),
        destination_country_code: CountryCodeInputSchema.nullable(),
        origin_lat: z.number().min(-90).max(90).nullable(),
        origin_lng: z.number().min(-180).max(180).nullable(),
        destination_lat: z.number().min(-90).max(90).nullable(),
        destination_lng: z.number().min(-180).max(180).nullable(),

        currency: CurrencyInputSchema,
        description: DescriptionInputSchema,
        instant_booking_enabled: z.boolean(),
        luggage_allowed: z.boolean(),
        pets_allowed: z.boolean(),
        smoking_allowed: z.boolean(),
        women_only: z.boolean(),
        max_two_backseat: z.boolean(),
    })
    .superRefine((input, ctx) => {
        const hasOriginLat = input.origin_lat !== null;
        const hasOriginLng = input.origin_lng !== null;
        const hasDestinationLat = input.destination_lat !== null;
        const hasDestinationLng = input.destination_lng !== null;

        if (hasOriginLat !== hasOriginLng) {
            ctx.addIssue({
                code: "custom",
                path: ["origin_lat"],
                message:
                    "origin_lat and origin_lng must either both be set or both be null",
            });
        }

        if (hasDestinationLat !== hasDestinationLng) {
            ctx.addIssue({
                code: "custom",
                path: ["destination_lat"],
                message:
                    "destination_lat and destination_lng must either both be set or both be null",
            });
        }

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
