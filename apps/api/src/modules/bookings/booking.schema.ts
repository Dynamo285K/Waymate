import { z } from "zod";
import {
    RideIdSchema,
    RideStopIdSchema,
    RideStatusSchema,
} from "../rides/ride.schema";
import { bookingStatusValues, CurrencySchema } from "../../shared";
import { UserIdSchema } from "../users/user.schema";

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

export const RejectBookingBodySchema = z.object({
    reason: z.string().max(500, "Rejection reason is too long").optional(),
});

export const BookingTimeframeQuerySchema = z.object({
    timeframe: z.enum(["UPCOMING", "PAST", "ALL"]).default("UPCOMING"),
});

// ==========================================
// 3. RESPONSE SCHEMAS (Outputs for Swagger)
// ==========================================
export const BookingActionResponseSchema = z.object({
    id: z.uuid(),

    status: z.enum(bookingStatusValues),
});

export const PassengerBookingListItemSchema = z.object({
    id: z.uuid(),
    bookingStatus: z.enum(bookingStatusValues),
    priceAmount: z.number().int(),
    currency: CurrencySchema,
    seatsLeft: z.number().int(),
    ride: z.object({
        id: RideIdSchema,
        departureAt: z.date(),
        rideStatus: RideStatusSchema,
    }),
    driver: z.object({
        id: UserIdSchema,
        firstName: z.string().nullable(),
        lastName: z.string().nullable(),
        profilePhotoUrl: z.string().nullable(),
        averageRating: z.number().nullable(),
        reviewCount: z.number().int(),
    }),
    pickupCity: z.string(),
    dropoffCity: z.string(),
    myReviewOfDriver: z
        .object({
            id: z.uuid(),
            rating: z.number().int().min(1).max(5),
        })
        .nullable(),
});

export const PassengerBookingListSchema =
    PassengerBookingListItemSchema.array();
