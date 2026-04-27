import { z } from "zod";

export const Decimal10_2NonNegativeSchema = z
    .number()
    .min(0)
    .max(99999999.99)
    .refine((value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-8, {
        message: "Must have at most 2 decimal places",
    });
