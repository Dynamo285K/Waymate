import { z } from "zod";
import { RideEntitySchema } from "./ride.schema";

export const RideOutputSchema = RideEntitySchema.pick({
    id: true,
    driver_id: true,
    car_id: true,
    ride_status_id: true,

    departure_at: true,
    arrival_estimate_at: true,

    origin_stop_id: true,
    destination_stop_id: true,

    origin_city: true,
    destination_city: true,
    origin_country_code: true,
    destination_country_code: true,
    origin_lat: true,
    origin_lng: true,
    destination_lat: true,
    destination_lng: true,

    available_seats_cached: true,
    currency: true,

    description: true,
    instant_booking_enabled: true,
    luggage_allowed: true,
    pets_allowed: true,
    smoking_allowed: true,
    women_only: true,
    max_two_backseat: true,

    created_at: true,
});

export type RideOutput = z.infer<typeof RideOutputSchema>;
