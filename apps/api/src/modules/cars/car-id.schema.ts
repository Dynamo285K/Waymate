import { z } from "zod";

export const CarIdSchema = z.uuid();

export type CarId = z.infer<typeof CarIdSchema>;
