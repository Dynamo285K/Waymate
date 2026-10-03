import { z } from "zod";

export const HealthResponseSchema = z.object({
    status: z.enum(["ok", "degraded"]),
    db: z.enum(["up", "down"]),
    commit: z.string(),
});

export type HealthResponse = z.infer<typeof HealthResponseSchema>;
