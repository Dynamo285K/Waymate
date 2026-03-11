import { z } from "zod";

export const CityInputSchema = z
    .string()
    .trim()
    .min(1)
    .max(100)
    .regex(/^[^\x00-\x1F\x7F]+$/, "City contains invalid control characters");
