import { z } from "zod";

export const CarModelIdSchema = z.number().int().positive();

export type CarModelId = z.infer<typeof CarModelIdSchema>;
