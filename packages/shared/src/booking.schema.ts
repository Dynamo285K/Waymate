import { z } from "zod";
import { RideIdSchema, RideStatusSchema } from "./ride.schema";
import { bookingStatusValues } from "./status-values";
import { CurrencySchema } from "./currency.schema";
import {
    PublicUserPreviewSchema,
    PublicUserPreviewWithRatingSchema,
} from "./user.schema";

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
        pickupStopId: z.string(),
        dropoffStopId: z.string(),
        seatCount: z.number().int().min(1, "You must book at least 1 seat"),
        dynamicPickup: z
            .object({
                lat: z.number(),
                lng: z.number(),
                city: z.string(),
            })
            .optional(),
        dynamicDropoff: z
            .object({
                lat: z.number(),
                lng: z.number(),
                city: z.string(),
            })
            .optional(),
        priceAmount: z.number().optional(),
        requestedPickupCity: z.string().optional(),
        requestedDropoffCity: z.string().optional(),
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
        arrivalEstimateAt: z.date().nullable(),
        rideStatus: RideStatusSchema,
    }),
    driver: PublicUserPreviewWithRatingSchema,
    pickupCity: z.string(),
    dropoffCity: z.string(),
    requestedPickupCity: z.string().nullable(),
    requestedDropoffCity: z.string().nullable(),
    originalStartCity: z.string(),
    originalEndCity: z.string(),
    myReviewOfDriver: z
        .object({
            id: z.uuid(),
            rating: z.number().int().min(1).max(5),
        })
        .nullable(),
});

export const PassengerBookingListSchema =
    PassengerBookingListItemSchema.array();

export const DriverRideRequestItemSchema = z.object({
    id: z.uuid(),
    rideId: RideIdSchema,
    seatCount: z.number().int(),
    priceAmount: z.number().int(),
    currency: CurrencySchema,
    passenger: PublicUserPreviewSchema.extend({
        averageRating: z.number().nullable(),
    }),
    pickupCity: z.string(),
    dropoffCity: z.string(),
    requestedPickupCity: z.string().nullable(),
    requestedDropoffCity: z.string().nullable(),
    originalStartCity: z.string(),
    originalEndCity: z.string(),
    departureAt: z.date(),
});

export const DriverRideRequestListSchema = DriverRideRequestItemSchema.array();
