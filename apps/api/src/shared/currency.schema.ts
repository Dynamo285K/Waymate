import { z } from "zod";

export const CurrencySchema = z.string().length(3);

export const CurrencyInputSchema = z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3}$/, "Must be a valid 3-letter currency code");
