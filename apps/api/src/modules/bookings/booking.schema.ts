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
    passengerId: UserIdSchema,
    rideId: RideIdSchema,
    bookingStatus: BookingStatusSchema,

    // Route and stop selection
    pickupStopId: RideStopIdSchema,
    dropoffStopId: RideStopIdSchema,

    // Capacity and pricing
    seatCount: z.number().int().min(1),
    priceAmount: Decimal10_2NonNegativeSchema,
    currency: CurrencySchema,

    // Booking lifecycle
    confirmedAt: z.date().nullable(),
    cancelledAt: z.date().nullable(),
    cancelledByUserId: UserIdSchema.nullable(),
    cancellationReason: z.string().max(500).nullable(),
    noShowMarkedAt: z.date().nullable(),

    // Timestamps
    createdAt: z.date(),
    updatedAt: z.date(),
    deletedAt: z.date().nullable(),
});

export const BookingEntitySchema = BookingBaseSchema.refine(
    (v) => v.pickupStopId !== v.dropoffStopId,
    {
        message: "pickupStopId and dropoffStopId must be different",
        path: ["dropoffStopId"],
    }
);

export const BookingOutputSchema = BookingBaseSchema.pick({
    id: true,
    passengerId: true,
    rideId: true,
    bookingStatus: true,

    pickupStopId: true,
    dropoffStopId: true,

    seatCount: true,
    priceAmount: true,
    currency: true,

    confirmedAt: true,
    cancelledAt: true,
    cancelledByUserId: true,
    cancellationReason: true,
    noShowMarkedAt: true,

    createdAt: true,
});

export const BookingInputSchema = z
    .object({
        rideId: RideIdSchema,
        pickupStopId: RideStopIdSchema,
        dropoffStopId: RideStopIdSchema,
        seatCount: z.number().int().min(1),
    })
    .refine((v) => v.pickupStopId !== v.dropoffStopId, {
        message: "pickupStopId and dropoffStopId must be different",
        path: ["dropoffStopId"],
    });

export const BookingStatusHistoryIdSchema = z.uuid();

export const BookingStatusHistoryEntitySchema = z.object({
    // Identity and relationships
    id: BookingStatusHistoryIdSchema,
    bookingId: BookingIdSchema,

    // Status transition
    oldStatus: BookingStatusSchema.nullable(),
    newStatus: BookingStatusSchema,
    changedByUserId: UserIdSchema.nullable(),
    reason: z.string().max(500).nullable(),

    // Timestamps
    createdAt: z.date(),
});

export type Booking = z.infer<typeof BookingEntitySchema>;
export type BookingOutput = z.infer<typeof BookingOutputSchema>;
export type BookingInput = z.infer<typeof BookingInputSchema>;
export type BookingStatusHistory = z.infer<
    typeof BookingStatusHistoryEntitySchema
>;
