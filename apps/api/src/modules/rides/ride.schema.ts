import { z } from "zod";
import { UserIdSchema } from "../users/user.schema";
import { CarIdSchema } from "../cars/car.schema";
import {
    CityInputSchema,
    CountryCodeInputSchema,
    CountryCodeSchema,
    CurrencyInputSchema,
    CurrencySchema,
    Decimal10_2NonNegativeSchema,
    rideStatusValues,
} from "../../shared";

export const RideIdSchema = z.uuid();
export type RideId = z.infer<typeof RideIdSchema>;

export const RideStopIdSchema = z.uuid();
export type RideStopId = z.infer<typeof RideStopIdSchema>;

export const PriceIdSchema = z.uuid();
export type PriceId = z.infer<typeof PriceIdSchema>;

export const RideStatusSchema = z.enum(rideStatusValues);
export type RideStatus = z.infer<typeof RideStatusSchema>;

const DescriptionSchema = z.string().max(500).nullable();
const DescriptionInputSchema = z.string().trim().max(500).nullable();
const AddressInputSchema = z.string().trim().min(1).max(255);

export const RideEntitySchema = z.object({
    // Identity and ownership
    id: RideIdSchema,
    driver_id: UserIdSchema,
    car_id: CarIdSchema,
    ride_status: RideStatusSchema,

    // Schedule
    departure_at: z.date(),
    arrival_estimate_at: z.date().nullable(),

    // Capacity and pricing
    offered_seats: z.number().int().min(1),
    currency: CurrencySchema,

    // Ride details
    description: DescriptionSchema,

    // Timestamps
    created_at: z.date(),
    updated_at: z.date(),
    deleted_at: z.date().nullable(),
});

export const RideOutputSchema = RideEntitySchema.pick({
    id: true,
    driver_id: true,
    car_id: true,
    ride_status: true,

    departure_at: true,
    arrival_estimate_at: true,

    offered_seats: true,
    currency: true,

    description: true,

    created_at: true,
});

export const RideInputSchema = z
    .object({
        car_id: CarIdSchema,

        departure_at: z.date(),
        arrival_estimate_at: z.date().nullable(),

        offered_seats: z.number().int().min(1),

        currency: CurrencyInputSchema,
        description: DescriptionInputSchema,
    })
    .superRefine((input, ctx) => {
        if (
            input.arrival_estimate_at !== null &&
            input.arrival_estimate_at < input.departure_at
        ) {
            ctx.addIssue({
                code: "custom",
                path: ["arrival_estimate_at"],
                message: "arrival_estimate_at cannot be before departure_at",
            });
        }
    });

export const RideStopEntitySchema = z.object({
    // Identity and relationships
    id: RideStopIdSchema,
    ride_id: RideIdSchema,

    // Stop location
    address: z.string().min(1).max(255),
    city: z.string().min(1).max(100),
    country_code: CountryCodeSchema.nullable(),
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),

    // Stop planning
    stop_order: z.number().int().min(0),
    planned_arrival_at: z.date().nullable(),
    planned_departure_at: z.date().nullable(),

    // Timestamps
    created_at: z.date(),
    updated_at: z.date(),
});

export const RideStopOutputSchema = RideStopEntitySchema.pick({
    id: true,
    ride_id: true,
    address: true,
    city: true,
    country_code: true,
    lat: true,
    lng: true,
    stop_order: true,
    planned_arrival_at: true,
    planned_departure_at: true,
});

export const RideStopInputSchema = z
    .object({
        address: AddressInputSchema,
        city: CityInputSchema,
        country_code: CountryCodeInputSchema.nullable(),
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
        stop_order: z.number().int().min(0),
        planned_arrival_at: z.date().nullable(),
        planned_departure_at: z.date().nullable(),
    })
    .superRefine((input, ctx) => {
        if (
            input.planned_arrival_at !== null &&
            input.planned_departure_at !== null &&
            input.planned_departure_at < input.planned_arrival_at
        ) {
            ctx.addIssue({
                code: "custom",
                path: ["planned_departure_at"],
                message:
                    "planned_departure_at cannot be before planned_arrival_at",
            });
        }
    });

export const PriceBaseSchema = z.object({
    // Identity and relationships
    id: PriceIdSchema,
    ride_id: RideIdSchema,
    start_stop_id: RideStopIdSchema,
    end_stop_id: RideStopIdSchema,

    // Segment ordering
    start_stop_order: z.number().int().min(0),
    end_stop_order: z.number().int().min(0),

    // Price details
    amount: Decimal10_2NonNegativeSchema,
    currency: CurrencySchema,

    // Timestamps
    created_at: z.date(),
    updated_at: z.date(),
});

export const PriceEntitySchema = PriceBaseSchema.refine(
    (value) => value.start_stop_id !== value.end_stop_id,
    {
        message: "start_stop_id and end_stop_id must be different",
        path: ["end_stop_id"],
    }
).refine((value) => value.start_stop_order < value.end_stop_order, {
    message: "start_stop_order must be lower than end_stop_order",
    path: ["end_stop_order"],
});

export const PriceOutputSchema = PriceBaseSchema.pick({
    id: true,
    ride_id: true,
    start_stop_id: true,
    end_stop_id: true,
    start_stop_order: true,
    end_stop_order: true,
    amount: true,
    currency: true,
});

export const PriceInputSchema = z
    .object({
        start_stop_id: RideStopIdSchema,
        end_stop_id: RideStopIdSchema,
        amount: Decimal10_2NonNegativeSchema,
        currency: CurrencyInputSchema,
    })
    .refine((value) => value.start_stop_id !== value.end_stop_id, {
        message: "start_stop_id and end_stop_id must be different",
        path: ["end_stop_id"],
    });

export const RideStatusHistoryIdSchema = z.uuid();

export const RideStatusHistoryEntitySchema = z.object({
    // Identity and relationships
    id: RideStatusHistoryIdSchema,
    ride_id: RideIdSchema,

    // Status transition
    old_status: RideStatusSchema.nullable(),
    new_status: RideStatusSchema,
    changed_by_user_id: UserIdSchema.nullable(),
    reason: z.string().max(500).nullable(),

    // Timestamps
    created_at: z.date(),
});

export type Ride = z.infer<typeof RideEntitySchema>;
export type RideOutput = z.infer<typeof RideOutputSchema>;
export type RideInput = z.infer<typeof RideInputSchema>;
export type RideStop = z.infer<typeof RideStopEntitySchema>;
export type RideStopOutput = z.infer<typeof RideStopOutputSchema>;
export type RideStopInput = z.infer<typeof RideStopInputSchema>;
export type Price = z.infer<typeof PriceEntitySchema>;
export type PriceOutput = z.infer<typeof PriceOutputSchema>;
export type PriceInput = z.infer<typeof PriceInputSchema>;
export type RideStatusHistory = z.infer<typeof RideStatusHistoryEntitySchema>;
