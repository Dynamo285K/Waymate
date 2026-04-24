import { z } from "zod";
import { RideIdSchema, RideStopIdSchema } from "../rides/ride.schema";
import { bookingStatusValues } from "../../shared";

// ==========================================
// 1. URL PARAMETERS
// ==========================================
export const BookingIdParamsSchema = z.object({
    id: z.uuid("Invalid booking ID"),
});

// ==========================================
// 2. REQUEST BODIES (Inputs from frontend)
// ==========================================
export const CreateBookingBodySchema = z
    .object({
        rideId: RideIdSchema,
        pickupStopId: RideStopIdSchema,
        dropoffStopId: RideStopIdSchema,
        seatCount: z.number().int().min(1, "You must book at least 1 seat"),
    })
    .refine((data) => data.pickupStopId !== data.dropoffStopId, {
        message: "Pickup and dropoff stops must be different",
        path: ["dropoffStopId"],
    });

export const CancelBookingBodySchema = z.object({
    reason: z.string().max(500, "Cancellation reason is too long").optional(),
});

// ==========================================
// 3. RESPONSE SCHEMAS (Outputs for Swagger)
// ==========================================
export const BookingActionResponseSchema = z.object({
    id: z.uuid(),

    status: z.enum(bookingStatusValues),
});
