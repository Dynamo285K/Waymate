import { z } from "zod";
import { RideStatusSchema } from "./ride-statuses.schema";
import { UserIdSchema } from "../users/user-id.schema";
import { CarIdSchema } from "../cars/car-id.schema";
import { RideIdSchema } from "./ride-id.schema";
import { CurrencySchema } from "../../shared";

const DescriptionSchema = z.string().max(500).nullable();

export const RideEntitySchema = z.object({
    // Identity and ownership
    id: RideIdSchema,
    driver_id: UserIdSchema,
    car_id: CarIdSchema,
    ride_status: RideStatusSchema,

    // Schedule
    departure_at: z.date(),
    arrival_estimate_at: z.date().nullable(),

    // Capacity and pricing
    offered_seats: z.number().int().min(1),
    currency: CurrencySchema,

    // Ride details
    description: DescriptionSchema,

    // Timestamps
    created_at: z.date(),
    updated_at: z.date(),
    deleted_at: z.date().nullable(),
});

export type Ride = z.infer<typeof RideEntitySchema>;
