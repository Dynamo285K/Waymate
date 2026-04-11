import { z } from "zod";
import { UserIdSchema } from "../users/user-id.schema";
import { BookingStatusSchema } from "./booking-statuses.schema";
import { BookingIdSchema } from "./booking-id.schema";
import { RideIdSchema } from "../rides/ride-id.schema";
import { RideStopIdSchema } from "../rides/ride-stop.schema";
import { CurrencySchema, Decimal10_2NonNegativeSchema } from "../../shared";

export const BookingBaseSchema = z.object({
    // Identity and relationships
    id: BookingIdSchema,
    passenger_id: UserIdSchema,
    ride_id: RideIdSchema,
    booking_status: BookingStatusSchema,

    // Route and stop selection
    pickup_stop_id: RideStopIdSchema,
    dropoff_stop_id: RideStopIdSchema,

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
});

export const BookingEntitySchema = BookingBaseSchema.refine(
    (v) => v.pickup_stop_id !== v.dropoff_stop_id,
    {
        message: "pickup_stop_id and dropoff_stop_id must be different",
        path: ["dropoff_stop_id"],
    }
);

export type Booking = z.infer<typeof BookingEntitySchema>;
