import { z } from "zod";

export const CountryCodeSchema = z.string().length(3);

export const CountryCodeInputSchema = z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3}$/, "Must be a valid 3-letter country code");
