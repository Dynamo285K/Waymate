import { z } from "zod";

export const HealthResponseSchema = z.object({
    status: z.enum(["ok", "degraded"]),
    db: z.enum(["up", "down"]),
});

export type HealthResponse = z.infer<typeof HealthResponseSchema>;
