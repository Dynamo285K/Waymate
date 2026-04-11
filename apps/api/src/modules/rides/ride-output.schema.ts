import { z } from "zod";
import { RideEntitySchema } from "./ride.schema";

export const RideOutputSchema = RideEntitySchema.pick({
    id: true,
    driver_id: true,
    car_id: true,
    ride_status: true,

    departure_at: true,
    arrival_estimate_at: true,

    offered_seats: true,
    currency: true,

    description: true,

    created_at: true,
});

export type RideOutput = z.infer<typeof RideOutputSchema>;
