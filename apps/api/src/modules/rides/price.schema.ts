import { z } from "zod";
import { PriceIdSchema } from "./price-id.schema";
import { RideIdSchema } from "./ride-id.schema";
import { RideStopIdSchema } from "./ride-stop.schema";
import { CurrencySchema, Decimal10_2NonNegativeSchema } from "../../shared";

export const PriceBaseSchema = z.object({
    id: PriceIdSchema,
    ride_id: RideIdSchema,
    start_stop_id: RideStopIdSchema,
    end_stop_id: RideStopIdSchema,
    start_stop_order: z.number().int().min(0),
    end_stop_order: z.number().int().min(0),
    amount: Decimal10_2NonNegativeSchema,
    currency: CurrencySchema,
    created_at: z.date(),
    updated_at: z.date(),
});

export const PriceEntitySchema = PriceBaseSchema.refine(
    (value) => value.start_stop_id !== value.end_stop_id,
    {
        message: "start_stop_id and end_stop_id must be different",
        path: ["end_stop_id"],
    }
).refine((value) => value.start_stop_order < value.end_stop_order, {
    message: "start_stop_order must be lower than end_stop_order",
    path: ["end_stop_order"],
});

export type Price = z.infer<typeof PriceEntitySchema>;
