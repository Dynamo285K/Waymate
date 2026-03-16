import { z } from "zod";

export const RideIdSchema = z.uuid();

export type RideId = z.infer<typeof RideIdSchema>;
