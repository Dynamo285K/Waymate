import { z } from "zod";
import { UserIdSchema } from "../users/user.schema";
import { CarIdSchema } from "../cars/car.schema";
import {
    CountryCodeSchema,
    CurrencySchema,
    bookingStatusValues,
    rideStatusValues,
} from "../../shared";

export const RideIdSchema = z.uuid();
export type RideId = z.infer<typeof RideIdSchema>;

export const RideStopIdSchema = z.uuid();
export type RideStopId = z.infer<typeof RideStopIdSchema>;

export const PriceIdSchema = z.uuid();
export type PriceId = z.infer<typeof PriceIdSchema>;

export const RideStatusSchema = z.enum(rideStatusValues);

const DescriptionSchema = z.string().max(500).nullable();

export const RideSchema = z.object({
    // Identity and ownership
    id: RideIdSchema,
    driverId: UserIdSchema,
    carId: CarIdSchema,
    rideStatus: RideStatusSchema,

    // Schedule
    departureAt: z.date(),
    arrivalEstimateAt: z.date().nullable(),

    // Capacity and pricing
    offeredSeats: z.number().int().min(1),
    currency: CurrencySchema,

    // Ride details
    description: DescriptionSchema,

    // Timestamps
    createdAt: z.date(),
    updatedAt: z.date(),
    deletedAt: z.date().nullable(),
});

export const CreateRideBodySchema = z.object({
    carId: CarIdSchema,
    departureAt: z.coerce.date(),
    arrivalEstimateAt: z.coerce.date().nullable().optional(),
    offeredSeats: z.number().int().min(1),
    currency: CurrencySchema,
    description: z.string().trim().max(500).nullable().optional(),

    stops: z
        .array(
            z.object({
                address: z.string().min(1).max(255),
                city: z.string().min(1).max(100),
                countryCode: CountryCodeSchema.nullable().optional(),
                lat: z.number().min(-90).max(90),
                lng: z.number().min(-180).max(180),
                plannedArrivalAt: z.coerce.date().nullable().optional(),
                plannedDepartureAt: z.coerce.date().nullable().optional(),
            })
        )
        .min(2, "Ride must have at least a start and an end stop"),

    prices: z
        .array(
            z.object({
                startStopOrder: z.number().int().min(0),
                endStopOrder: z.number().int().min(0),
                amount: z.number().int().min(0, "Price cannot be negative"),
                currency: CurrencySchema.optional(),
            })
        )
        .optional(),
});

export const SearchRidesQuerySchema = z.object({
    startCity: z.string().min(1),
    destinationCity: z.string().min(1),
    travelDate: z.coerce.date(),
});

export const RideSearchResultItemSchema = z.object({
    rideId: RideIdSchema,
    departureAt: z.date(),
    rideStatus: RideStatusSchema,
    offeredSeats: z.number(),
    driver: z.object({
        id: UserIdSchema,
        firstName: z.string(),
        lastName: z.string(),
        profilePhotoUrl: z.string().nullable(),
        averageRating: z.number().nullable(),
        reviewCount: z.number().int(),
    }),
    pickupStop: z.object({
        pickupStopId: RideStopIdSchema,
        city: z.string(),
        plannedDepartureAt: z.date().nullable(),
    }),
    dropoffStop: z.object({
        dropoffStopId: RideStopIdSchema,
        city: z.string(),
        plannedArrivalAt: z.date().nullable(),
    }),
    priceAmount: z.number().nullable(),
    currency: CurrencySchema,
});

export const RideStopSchema = z.object({
    // Identity and relationships
    id: RideStopIdSchema,
    rideId: RideIdSchema,

    // Stop location
    address: z.string().min(1).max(255),
    city: z.string().min(1).max(100),
    countryCode: CountryCodeSchema.nullable(),
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),

    // Stop planning
    stopOrder: z.number().int().min(0),
    plannedArrivalAt: z.date().nullable(),
    plannedDepartureAt: z.date().nullable(),

    // Timestamps
    createdAt: z.date(),
    updatedAt: z.date(),
});

export const PriceBaseSchema = z.object({
    // Identity and relationships
    id: PriceIdSchema,
    rideId: RideIdSchema,
    startStopId: RideStopIdSchema,
    endStopId: RideStopIdSchema,

    // Price details
    amount: z.number().int().min(0),
    currency: CurrencySchema,

    // Timestamps
    createdAt: z.date(),
    updatedAt: z.date(),
});

export const PriceSchema = PriceBaseSchema.refine(
    (value) => value.startStopId !== value.endStopId,
    {
        message: "startStopId and endStopId must be different",
        path: ["endStopId"],
    }
);

export const RideStatusHistoryIdSchema = z.uuid();

export const RideStatusHistoryEntitySchema = z.object({
    // Identity and relationships
    id: RideStatusHistoryIdSchema,
    rideId: RideIdSchema,

    // Status transition
    oldStatus: RideStatusSchema.nullable(),
    newStatus: RideStatusSchema,
    changedByUserId: UserIdSchema.nullable(),
    reason: z.string().max(500).nullable(),

    // Timestamps
    createdAt: z.date(),
});

export const RideIdParamsSchema = z.object({
    id: RideIdSchema,
});

export const CancelRideBodySchema = z.object({
    reason: z.string().trim().max(500).optional(),
});

export const TimeframeQuerySchema = z.object({
    timeframe: z.enum(["UPCOMING", "PAST", "ALL"]).default("UPCOMING"),
});

export type RideIdParams = z.infer<typeof RideIdParamsSchema>;
export type CancelRideBody = z.infer<typeof CancelRideBodySchema>;
export type TimeframeQuery = z.infer<typeof TimeframeQuerySchema>;

export type CreateRideBody = z.infer<typeof CreateRideBodySchema>;
export type SearchRidesQuery = z.infer<typeof SearchRidesQuerySchema>;

// ==========================================
// Output schemas (SWAGGER / RESPONSE)
// ==========================================

export const PublicDriverProfileSchema = z.object({
    id: UserIdSchema,
    firstName: z.string().nullable(),
    lastName: z.string().nullable(),
    profilePhotoUrl: z.url().nullable(),
});

export const RideListItemSchema = RideSchema.extend({
    rideStops: z.array(
        z.object({
            city: z.string(),
            stopOrder: z.number().int(),
        })
    ),
    bookings: z.array(
        z.object({
            id: z.uuid(),
            seatCount: z.number().int(),
        })
    ),
    prices: z.array(
        z.object({
            amount: z.number().int(),
            currency: CurrencySchema,
            startStopId: RideStopIdSchema,
            endStopId: RideStopIdSchema,
        })
    ),
});

export const RideListItemListSchema = z.array(RideListItemSchema);

export const RidePassengersViewSchema = z.object({
    ride: z.object({
        id: RideIdSchema,
        departureAt: z.date(),
        rideStatus: RideStatusSchema,
        offeredSeats: z.number().int(),
        currency: CurrencySchema,
        rideStops: z.array(
            z.object({
                id: RideStopIdSchema,
                city: z.string(),
                stopOrder: z.number().int(),
            })
        ),
        canReview: z.boolean(),
    }),
    passengerCount: z.number().int(),
    passengers: z.array(
        z.object({
            bookingId: z.uuid(),
            bookingStatus: z.enum(bookingStatusValues),
            seatCount: z.number().int(),
            passenger: PublicDriverProfileSchema,
            pickupStop: z
                .object({
                    id: RideStopIdSchema,
                    city: z.string(),
                    stopOrder: z.number().int(),
                })
                .nullable(),
            dropoffStop: z
                .object({
                    id: RideStopIdSchema,
                    city: z.string(),
                    stopOrder: z.number().int(),
                })
                .nullable(),
            myReviewOfPassenger: z
                .object({
                    id: z.uuid(),
                    rating: z.number().int().min(1).max(5),
                })
                .nullable(),
        })
    ),
});

export const RideSearchResultListSchema = z.array(RideSearchResultItemSchema);

export const CreateRideResponseSchema = z.object({
    id: RideIdSchema,
});

export const CancelRideResponseSchema = z.object({
    id: RideIdSchema,
    status: z.literal("CANCELLED"),
});
