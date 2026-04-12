import { z } from "zod";
import { UserIdSchema } from "../users/user.schema";
import { RideIdSchema, RideStopIdSchema } from "../rides/ride.schema";
import {
    bookingStatusValues,
    CurrencySchema,
    Decimal10_2NonNegativeSchema,
} from "../../shared";

export const BookingIdSchema = z.uuid();
export type BookingId = z.infer<typeof BookingIdSchema>;

export const BookingStatusSchema = z.enum(bookingStatusValues);
export type BookingStatus = z.infer<typeof BookingStatusSchema>;

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

export const BookingOutputSchema = BookingBaseSchema.pick({
    id: true,
    passenger_id: true,
    ride_id: true,
    booking_status: true,

    pickup_stop_id: true,
    dropoff_stop_id: true,

    seat_count: true,
    price_amount: true,
    currency: true,

    confirmed_at: true,
    cancelled_at: true,
    cancelled_by_user_id: true,
    cancellation_reason: true,
    no_show_marked_at: true,

    created_at: true,
});

export const BookingInputSchema = z
    .object({
        ride_id: RideIdSchema,
        pickup_stop_id: RideStopIdSchema,
        dropoff_stop_id: RideStopIdSchema,
        seat_count: z.number().int().min(1),
    })
    .refine((v) => v.pickup_stop_id !== v.dropoff_stop_id, {
        message: "pickup_stop_id and dropoff_stop_id must be different",
        path: ["dropoff_stop_id"],
    });

export const BookingStatusHistoryIdSchema = z.uuid();

export const BookingStatusHistoryEntitySchema = z.object({
    // Identity and relationships
    id: BookingStatusHistoryIdSchema,
    booking_id: BookingIdSchema,

    // Status transition
    old_status: BookingStatusSchema.nullable(),
    new_status: BookingStatusSchema,
    changed_by_user_id: UserIdSchema.nullable(),
    reason: z.string().max(500).nullable(),

    // Timestamps
    created_at: z.date(),
});

export type Booking = z.infer<typeof BookingEntitySchema>;
export type BookingOutput = z.infer<typeof BookingOutputSchema>;
export type BookingInput = z.infer<typeof BookingInputSchema>;
export type BookingStatusHistory = z.infer<
    typeof BookingStatusHistoryEntitySchema
>;
