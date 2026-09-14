import { z } from "zod";

export const ratingsSearchSchema = z.object({
    view: z.enum(["received", "authored"]).optional(),
    userId: z.string().optional(),
    name: z.string().optional(),
});
