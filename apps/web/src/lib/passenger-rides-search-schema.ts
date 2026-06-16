import { z } from "zod";

export const passengerRidesSearchSchema = z.object({
    tab: z.enum(["upcoming", "past"]).optional(),
});
