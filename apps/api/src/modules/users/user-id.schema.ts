import { z } from "zod";

export const UserIdSchema = z.uuid();

export type UserId = z.infer<typeof UserIdSchema>;
