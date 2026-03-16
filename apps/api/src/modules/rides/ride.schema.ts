import { z } from "zod";
import { RideStatusIdSchema } from "./ride-statuses.schema";
import { RideStopIdSchema } from "./ride-stop.schema";
import { UserIdSchema } from "../users/user-id.schema";
import { CarIdSchema } from "../cars/car-id.schema";
import { RideIdSchema } from "./ride-id.schema";
import { CountryCodeSchema, CurrencySchema } from "../../shared/schemas";

const CitySchema = z.string().min(1).max(100);

const DescriptionSchema = z.string().max(500).nullable();

export const RideEntitySchema = z.object({
    // Identity and ownership
    id: RideIdSchema,
    driver_id: UserIdSchema,
    car_id: CarIdSchema,
    ride_status_id: RideStatusIdSchema,

    // Schedule
    departure_at: z.date(),
    arrival_estimate_at: z.date().nullable(),

    // Route and stop references
    origin_stop_id: RideStopIdSchema.nullable(),
    destination_stop_id: RideStopIdSchema.nullable(),

    // Route search/location fields
    origin_city: CitySchema,
    destination_city: CitySchema,
    origin_country_code: CountryCodeSchema.nullable(),
    destination_country_code: CountryCodeSchema.nullable(),
    origin_lat: z.number().min(-90).max(90).nullable(),
    origin_lng: z.number().min(-180).max(180).nullable(),
    destination_lat: z.number().min(-90).max(90).nullable(),
    destination_lng: z.number().min(-180).max(180).nullable(),

    // Capacity and pricing
    available_seats_cached: z.number().int().min(0),
    currency: CurrencySchema,

    // Ride details and preferences
    description: DescriptionSchema,
    instant_booking_enabled: z.boolean(),
    luggage_allowed: z.boolean(),
    pets_allowed: z.boolean(),
    smoking_allowed: z.boolean(),
    women_only: z.boolean(),
    max_two_backseat: z.boolean(),

    // Timestamps
    created_at: z.date(),
    updated_at: z.date(),
    deleted_at: z.date().nullable(),
});

export type Ride = z.infer<typeof RideEntitySchema>;
