import { z } from "zod";
import { PriceBaseSchema } from "./price.schema";

export const PriceOutputSchema = PriceBaseSchema.pick({
    id: true,
    ride_id: true,
    start_stop_id: true,
    end_stop_id: true,
    start_stop_order: true,
    end_stop_order: true,
    amount: true,
    currency: true,
});

export type PriceOutput = z.infer<typeof PriceOutputSchema>;
