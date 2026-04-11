import { z } from "zod";
import { UserIdSchema } from "./user-id.schema";
import { UserStatusSchema } from "./user-statuses.schema";

const UserStatusHistoryIdSchema = z.uuid();

export const UserStatusHistoryEntitySchema = z.object({
    // Identity and relationships
    id: UserStatusHistoryIdSchema,
    user_id: UserIdSchema,

    // Status transition
    old_status: UserStatusSchema.nullable(),
    new_status: UserStatusSchema,
    changed_by_user_id: UserIdSchema.nullable(),
    reason: z.string().max(500).nullable(),

    // Timestamps
    created_at: z.date(),
});

export type UserStatusHistory = z.infer<typeof UserStatusHistoryEntitySchema>;
