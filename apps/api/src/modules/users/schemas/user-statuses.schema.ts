import { z } from 'zod';

export const UserStatusSchema = z.enum([
  'PENDING', 
  'ACTIVE', 
  'SUSPENDED', 
  'BANNED', 
  'DELETED'
]);

export type UserStatus = z.infer<typeof UserStatusSchema>;