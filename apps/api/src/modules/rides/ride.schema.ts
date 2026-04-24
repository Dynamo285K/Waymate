import { z } from "zod";
import { UserIdSchema } from "../users/user.schema";
import { CarIdSchema } from "../cars/car.schema";
import {
    CountryCodeSchema,
    CurrencySchema,
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
    departureAt: z.coerce.date(), // coerce zmení string z JSONu na Date objekt
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
        .min(2, "Ride must have at least a start and an end stop"), // Musia byť aspoň 2 zastávky

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

// Schéma pre validáciu parametrov vyhľadávania (GET /api/rides/search?startCity=...&)
export const SearchRidesQuerySchema = z.object({
    startCity: z.string().min(1),
    destinationCity: z.string().min(1),
    travelDate: z.coerce.date(), // Prekonvertuje "2024-05-20" na Date
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
