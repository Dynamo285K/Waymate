import { z } from "zod";
import { RideIdSchema } from "./ride-id.schema";
import { CountryCodeSchema } from "../../shared";

export const RideStopIdSchema = z.uuid();

export const RideStopEntitySchema = z.object({
    id: RideStopIdSchema,
    ride_id: RideIdSchema,
    address: z.string().min(1).max(255),
    city: z.string().min(1).max(100),
    country_code: CountryCodeSchema.nullable(),
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    stop_order: z.number().int().min(0),
    planned_arrival_at: z.date().nullable(),
    planned_departure_at: z.date().nullable(),
    created_at: z.date(),
    updated_at: z.date(),
});

export type RideStop = z.infer<typeof RideStopEntitySchema>;
