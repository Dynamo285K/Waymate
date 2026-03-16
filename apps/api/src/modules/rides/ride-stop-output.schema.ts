import { z } from "zod";
import { RideStopEntitySchema } from "./ride-stop.schema";

export const RideStopOutputSchema = RideStopEntitySchema.pick({
    id: true,
    ride_id: true,
    address: true,
    city: true,
    country_code: true,
    lat: true,
    lng: true,
    stop_order: true,
    planned_arrival_at: true,
    planned_departure_at: true,
});

export type RideStopOutput = z.infer<typeof RideStopOutputSchema>;
