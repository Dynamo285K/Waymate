import { z } from "zod";

// FK columns reference booking_statuses.id (integer lookup IDs 1..6)
export const BookingStatusIdSchema = z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
    z.literal(6),
]);

export const BookingStatusCodeSchema = z.enum([
    "PENDING",
    "CONFIRMED",
    "REJECTED",
    "CANCELLED",
    "COMPLETED",
    "NO_SHOW",
]);

export const bookingStatusCodeToIdMap = {
    PENDING: 1,
    CONFIRMED: 2,
    REJECTED: 3,
    CANCELLED: 4,
    COMPLETED: 5,
    NO_SHOW: 6,
} as const satisfies Record<z.infer<typeof BookingStatusCodeSchema>, number>;

export const bookingStatusIdToCodeMap = {
    1: "PENDING",
    2: "CONFIRMED",
    3: "REJECTED",
    4: "CANCELLED",
    5: "COMPLETED",
    6: "NO_SHOW",
} as const satisfies Record<
    z.infer<typeof BookingStatusIdSchema>,
    z.infer<typeof BookingStatusCodeSchema>
>;

// Backward-compatible alias for existing imports.
export const BookingStatusSchema = BookingStatusCodeSchema;

export type BookingStatusId = z.infer<typeof BookingStatusIdSchema>;
export type BookingStatusCode = z.infer<typeof BookingStatusCodeSchema>;
export type BookingStatus = BookingStatusCode;
