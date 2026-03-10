import { z } from "zod";

// FK columns reference user_statuses.id (integer)
export const UserStatusIdSchema = z.number().int();

export const UserStatusSchema = z.enum([
    "PENDING",
    "ACTIVE",
    "SUSPENDED",
    "BANNED",
    "DELETED",
]);

export type UserStatusId = z.infer<typeof UserStatusIdSchema>;
export type UserStatus = z.infer<typeof UserStatusSchema>;
