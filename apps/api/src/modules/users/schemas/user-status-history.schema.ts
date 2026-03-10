import { z } from 'zod';
import { UserIdSchema } from './user.schema';
import { UserStatusSchema } from './user-statuses.schema';

const UserStatusHistoryIdSchema = z.string().uuid();

export const UserStatusHistoryEntitySchema = z.object({
  id: UserStatusHistoryIdSchema,
  user_id: UserIdSchema,
  old_status_id: UserStatusSchema.nullable(),
  new_status_id: UserStatusSchema,
  changed_by_user_id: UserIdSchema.nullable(),
  reason: z.string().nullable(),
  created_at: z.date(),
  
});


export type UserStatusHistory = z.infer<typeof UserStatusHistoryEntitySchema>;