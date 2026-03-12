import { z } from "zod";
import { RideStopIdSchema } from "./ride-stop.schema";
import {
    CurrencyInputSchema,
    Decimal10_2NonNegativeSchema,
} from "../../../shared/schemas";

export const PriceInputSchema = z
    .object({
        start_stop_id: RideStopIdSchema,
        end_stop_id: RideStopIdSchema,
        amount: Decimal10_2NonNegativeSchema,
        currency: CurrencyInputSchema,
    })
    .refine((value) => value.start_stop_id !== value.end_stop_id, {
        message: "start_stop_id and end_stop_id must be different",
        path: ["end_stop_id"],
    });

export type PriceInput = z.infer<typeof PriceInputSchema>;
