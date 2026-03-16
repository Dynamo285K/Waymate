import { z } from "zod";

// FK columns reference ride_statuses.id (integer lookup IDs 1..4)
export const RideStatusIdSchema = z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
]);

export const RideStatusCodeSchema = z.enum([
    "PLANNED",
    "IN_PROGRESS",
    "COMPLETED",
    "CANCELLED",
]);

export const rideStatusCodeToIdMap = {
    PLANNED: 1,
    IN_PROGRESS: 2,
    COMPLETED: 3,
    CANCELLED: 4,
} as const satisfies Record<z.infer<typeof RideStatusCodeSchema>, number>;

export const rideStatusIdToCodeMap = {
    1: "PLANNED",
    2: "IN_PROGRESS",
    3: "COMPLETED",
    4: "CANCELLED",
} as const satisfies Record<
    z.infer<typeof RideStatusIdSchema>,
    z.infer<typeof RideStatusCodeSchema>
>;

// Backward-compatible alias for existing imports.
export const RideStatusSchema = RideStatusCodeSchema;

export type RideStatusId = z.infer<typeof RideStatusIdSchema>;
export type RideStatusCode = z.infer<typeof RideStatusCodeSchema>;
export type RideStatus = RideStatusCode;
