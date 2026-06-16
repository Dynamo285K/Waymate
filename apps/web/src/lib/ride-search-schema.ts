import { z } from "zod";

export const rideSearchSchema = z.object({
    startLat: z.coerce.number().optional(),
    startLng: z.coerce.number().optional(),
    startCity: z.string().optional(),
    destLat: z.coerce.number().optional(),
    destLng: z.coerce.number().optional(),
    destCity: z.string().optional(),
    date: z.string().optional(),
    seats: z.coerce.number().int().min(1).optional(),
});
