import { z } from "zod";

// FK columns reference user_statuses.id (integer lookup IDs 1..5)
export const UserStatusIdSchema = z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
]);

export const UserStatusCodeSchema = z.enum([
    "PENDING",
    "ACTIVE",
    "SUSPENDED",
    "BANNED",
    "DELETED",
]);

export const UserStatusCodeToIdMap = {
    PENDING: 1,
    ACTIVE: 2,
    SUSPENDED: 3,
    BANNED: 4,
    DELETED: 5,
} as const satisfies Record<z.infer<typeof UserStatusCodeSchema>, number>;

export const UserStatusIdToCodeMap = {
    1: "PENDING",
    2: "ACTIVE",
    3: "SUSPENDED",
    4: "BANNED",
    5: "DELETED",
} as const satisfies Record<
    z.infer<typeof UserStatusIdSchema>,
    z.infer<typeof UserStatusCodeSchema>
>;

export const UserStatusSchema = UserStatusCodeSchema;

export type UserStatusId = z.infer<typeof UserStatusIdSchema>;
export type UserStatusCode = z.infer<typeof UserStatusCodeSchema>;
export type UserStatus = UserStatusCode;
