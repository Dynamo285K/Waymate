import { z } from "zod";
import { UserIdSchema } from "../users/user-id.schema";
import { RideIdSchema } from "./ride-id.schema";
import { RideStatusSchema } from "./ride-statuses.schema";

const RideStatusHistoryIdSchema = z.uuid();

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

export type RideStatusHistory = z.infer<typeof RideStatusHistoryEntitySchema>;
