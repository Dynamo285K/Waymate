import { z } from "zod";

export const driverRidesSearchSchema = z.object({
    tab: z.enum(["upcoming", "past"]).optional(),
});
