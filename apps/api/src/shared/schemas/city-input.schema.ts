import { z } from "zod";

export const CityInputSchema = z
    .string()
    .trim()
    .min(1)
    .max(100)
    .refine(
        (value) => {
            return [...value].every((char) => {
                const code = char.charCodeAt(0);
                return !((code >= 0 && code <= 31) || code === 127);
            });
        },
        {
            message: "City contains invalid control characters",
        }
    );
