import { z } from "zod";
import { BookingBaseSchema } from "./booking.schema";

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

export type BookingOutput = z.infer<typeof BookingOutputSchema>;
