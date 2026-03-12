import { z } from "zod";

export const PriceIdSchema = z.uuid();

export type PriceId = z.infer<typeof PriceIdSchema>;
