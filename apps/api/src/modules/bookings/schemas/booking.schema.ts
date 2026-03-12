import { z } from "zod";
import { UserIdSchema } from "../../users/schemas/user-id.schema";
import { BookingStatusIdSchema } from "./booking-statuses.schema";
import { BookingIdSchema } from "./booking-id.schema";
import { RideIdSchema } from "../../rides/schemas/ride-id.schema";
import { RideStopIdSchema } from "../../rides/schemas/ride-stop.schema";
import {
    CurrencySchema,
    Decimal10_2NonNegativeSchema,
} from "../../../shared/schemas";

export const BookingEntitySchema = z
    .object({
        // Identity and relationships
        id: BookingIdSchema,
        passenger_id: UserIdSchema,
        ride_id: RideIdSchema,
        booking_status_id: BookingStatusIdSchema,

        // Route and stop selection
        pickup_stop_id: RideStopIdSchema,
        dropoff_stop_id: RideStopIdSchema,
        pickup_order: z.number().int().min(0),
        dropoff_order: z.number().int().min(0),

        // Capacity and pricing
        seat_count: z.number().int().min(1),
        price_amount: Decimal10_2NonNegativeSchema,
        currency: CurrencySchema,

        // Booking lifecycle
        confirmed_at: z.date().nullable(),
        cancelled_at: z.date().nullable(),
        cancelled_by_user_id: UserIdSchema.nullable(),
        cancellation_reason: z.string().max(500).nullable(),
        no_show_marked_at: z.date().nullable(),

        // Timestamps
        created_at: z.date(),
        updated_at: z.date(),
        deleted_at: z.date().nullable(),
    })
    .refine((v) => v.pickup_stop_id !== v.dropoff_stop_id, {
        message: "pickup_stop_id and dropoff_stop_id must be different",
        path: ["dropoff_stop_id"],
    })
    .refine((v) => v.pickup_order < v.dropoff_order, {
        message: "pickup_order must be lower than dropoff_order",
        path: ["dropoff_order"],
    });

export type Booking = z.infer<typeof BookingEntitySchema>;
