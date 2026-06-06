import { z } from "zod";
import {
    UserIdSchema,
    PublicUserPreviewSchema,
    PublicUserPreviewWithRatingSchema,
} from "./user.schema";
import { CarIdSchema } from "./car.schema";

import { CountryCodeSchema } from "./country-code.schema";
import { CurrencySchema } from "./currency.schema";
import {
    bookingStatusValues,
    rideEndSourceValues,
    rideStatusValues,
} from "./status-values";

export const RideIdSchema = z.uuid();
export type RideId = z.infer<typeof RideIdSchema>;

export const RideStopIdSchema = z.uuid();
export type RideStopId = z.infer<typeof RideStopIdSchema>;

export const PriceIdSchema = z.uuid();
export type PriceId = z.infer<typeof PriceIdSchema>;

export const RideStatusSchema = z.enum(rideStatusValues);
export type RideStatus = z.infer<typeof RideStatusSchema>;

export const RideEndSourceSchema = z.enum(rideEndSourceValues);
export type RideEndSource = z.infer<typeof RideEndSourceSchema>;

const DescriptionSchema = z.string().max(500).nullable();
const EndReasonSchema = z.string().max(500).nullable();

export const RideSchema = z.object({
    // Identity and ownership
    id: RideIdSchema,
    driverId: UserIdSchema,
    carId: CarIdSchema,
    rideStatus: RideStatusSchema,

    // Schedule
    departureAt: z.date(),
    arrivalEstimateAt: z.date().nullable(),
    autoEndAt: z.date().nullable(),
    endedAt: z.date().nullable(),
    endedByUserId: UserIdSchema.nullable(),
    endSource: RideEndSourceSchema.nullable(),
    endReason: EndReasonSchema,
    autoEndProcessedAt: z.date().nullable(),

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

export const CreateRideBodySchema = z
    .object({
        carId: CarIdSchema,
        departureAt: z.coerce.date(),
        arrivalEstimateAt: z.coerce.date().nullable().optional(),
        // The trip length in minutes — the way the client is expected to
        // express arrival. The service resolves it to an absolute
        // arrivalEstimateAt (departureAt + duration); a duration is never
        // stored, it is meaningless without the departure anchor. Capped at
        // 24 h. At most one of arrivalEstimateAt / durationMinutes may be sent.
        durationMinutes: z
            .number()
            .int()
            .positive()
            .max(24 * 60)
            .optional(),
        offeredSeats: z.number().int().min(1),
        currency: CurrencySchema,
        description: z.string().trim().max(500).nullable().optional(),

        stops: z
            .array(
                z.object({
                    address: z.string().min(1).max(255),
                    city: z.string().min(1).max(100),
                    countryCode: CountryCodeSchema,
                    lat: z.number().min(-90).max(90),
                    lng: z.number().min(-180).max(180),
                    plannedArrivalAt: z.coerce.date().nullable().optional(),
                    plannedDepartureAt: z.coerce.date().nullable().optional(),
                })
            )
            .min(2, "Ride must have at least a start and an end stop")
            .max(25, "A ride can have at most 25 stops"),

        prices: z
            .array(
                z
                    .object({
                        startStopOrder: z.number().int().min(0),
                        endStopOrder: z.number().int().min(0),
                        amount: z
                            .number()
                            .int()
                            .min(0, "Price cannot be negative"),
                        currency: CurrencySchema.optional(),
                    })
                    // A price covers a forward segment; equal or reversed
                    // orders would map to the same stop (prices_distinct_stops_chk)
                    // or to an unbookable backwards segment.
                    .refine(
                        (price) => price.startStopOrder < price.endStopOrder,
                        {
                            message:
                                "startStopOrder must come before endStopOrder",
                            path: ["endStopOrder"],
                        }
                    )
            )
            .max(300, "Too many price segments")
            .optional(),
    })
    // A ride is always offered for the future. Validating it at the boundary
    // turns a past departure into a 400 instead of creating a ride that is
    // invisible to search yet immediately completable. Arrival-time ordering
    // is intentionally left to the DB CHECK constraints for now.
    .refine((data) => data.departureAt.getTime() > Date.now(), {
        message: "departureAt must be in the future",
        path: ["departureAt"],
    })
    // Arrival is expressed as a duration; arrivalEstimateAt stays accepted for
    // flexibility, but sending both is ambiguous — two sources for one value.
    .refine(
        (data) =>
            data.arrivalEstimateAt == null || data.durationMinutes == null,
        {
            message:
                "Provide either arrivalEstimateAt or durationMinutes, not both",
            path: ["durationMinutes"],
        }
    );

export const SearchRidesQuerySchema = z.object({
    startLat: z.coerce.number().min(-90).max(90),
    startLng: z.coerce.number().min(-180).max(180),
    destLat: z.coerce.number().min(-90).max(90),
    destLng: z.coerce.number().min(-180).max(180),
    travelDate: z.coerce.date(),
});

export const RideSearchResultItemSchema = z.object({
    rideId: RideIdSchema,
    departureAt: z.date(),
    arrivalEstimateAt: z.date().nullable(),
    rideStatus: RideStatusSchema,
    offeredSeats: z.number(),
    seatsLeft: z.number().int(),
    driver: PublicUserPreviewWithRatingSchema,
    pickupStop: z.object({
        pickupStopId: RideStopIdSchema,
        city: z.string(),
        plannedDepartureAt: z.date().nullable(),
        distanceKm: z.number().optional(),
    }),
    dropoffStop: z.object({
        dropoffStopId: RideStopIdSchema,
        city: z.string(),
        plannedArrivalAt: z.date().nullable(),
        distanceKm: z.number().optional(),
    }),
    priceAmount: z.number().nullable(),
    currency: CurrencySchema,
});

export const AvailableRideItemSchema = z.object({
    rideId: RideIdSchema,
    departureAt: z.date(),
    arrivalEstimateAt: z.date().nullable(),
    rideStatus: RideStatusSchema,
    offeredSeats: z.number().int(),
    seatsLeft: z.number().int(),
    driver: PublicUserPreviewWithRatingSchema,
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

export const CompleteRideBodySchema = z.object({
    reason: z.string().trim().max(500).optional(),
});

export const EndRideBodySchema = z.object({
    reason: z.string().trim().max(500).optional(),
});

export const TimeframeQuerySchema = z.object({
    timeframe: z.enum(["UPCOMING", "PAST", "ALL"]).default("UPCOMING"),
});

export type RideIdParams = z.infer<typeof RideIdParamsSchema>;
export type CancelRideBody = z.infer<typeof CancelRideBodySchema>;
export type CompleteRideBody = z.infer<typeof CompleteRideBodySchema>;
export type EndRideBody = z.infer<typeof EndRideBodySchema>;
export type TimeframeQuery = z.infer<typeof TimeframeQuerySchema>;

export type CreateRideBody = z.infer<typeof CreateRideBodySchema>;
export type SearchRidesQuery = z.infer<typeof SearchRidesQuerySchema>;

// ==========================================
// Output schemas (SWAGGER / RESPONSE)
// ==========================================

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
            passenger: PublicUserPreviewSchema,
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
export const AvailableRideListSchema = z.array(AvailableRideItemSchema);

export const CreateRideResponseSchema = z.object({
    id: RideIdSchema,
});

export const CancelRideResponseSchema = z.object({
    id: RideIdSchema,
    status: z.literal("CANCELLED"),
});

export const CompleteRideResponseSchema = z.object({
    id: RideIdSchema,
    status: z.literal("COMPLETED"),
});

export const EndRideResponseSchema = z.object({
    id: RideIdSchema,
    status: z.literal("COMPLETED"),
});
