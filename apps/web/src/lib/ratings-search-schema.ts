import { z } from "zod";

export const ratingsSearchSchema = z.object({
    view: z.enum(["received", "authored"]).optional(),
});
