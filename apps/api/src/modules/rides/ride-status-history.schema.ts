import { z } from "zod";
import { UserIdSchema } from "../users/user-id.schema";
import { RideIdSchema } from "./ride-id.schema";
import { RideStatusIdSchema } from "./ride-statuses.schema";

const RideStatusHistoryIdSchema = z.uuid();

export const RideStatusHistoryEntitySchema = z.object({
    id: RideStatusHistoryIdSchema,
    ride_id: RideIdSchema,
    old_status_id: RideStatusIdSchema.nullable(),
    new_status_id: RideStatusIdSchema,
    changed_by_user_id: UserIdSchema.nullable(),
    reason: z.string().max(500).nullable(), // Should be updated in DB schema as well
    created_at: z.date(),
});

export type RideStatusHistory = z.infer<typeof RideStatusHistoryEntitySchema>;
