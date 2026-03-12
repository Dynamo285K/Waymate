import { z } from "zod";
import { RideIdSchema } from "../../rides/schemas/ride-id.schema";
import { RideStopIdSchema } from "../../rides/schemas/ride-stop.schema";

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

export type BookingInput = z.infer<typeof BookingInputSchema>;
