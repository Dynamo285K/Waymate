import { z } from "zod";
import { userStatusValues } from "../../shared";

export const UserStatusSchema = z.enum(userStatusValues);
export type UserStatus = z.infer<typeof UserStatusSchema>;
