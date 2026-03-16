import { z } from "zod";
import { UserIdSchema } from "./user-id.schema";
import { UserStatusIdSchema } from "./user-statuses.schema";

const UserStatusHistoryIdSchema = z.uuid();

export const UserStatusHistoryEntitySchema = z.object({
    id: UserStatusHistoryIdSchema,
    user_id: UserIdSchema,
    old_status_id: UserStatusIdSchema.nullable(),
    new_status_id: UserStatusIdSchema,
    changed_by_user_id: UserIdSchema.nullable(),
    reason: z.string().max(500).nullable(),
    created_at: z.date(),
});

export type UserStatusHistory = z.infer<typeof UserStatusHistoryEntitySchema>;
