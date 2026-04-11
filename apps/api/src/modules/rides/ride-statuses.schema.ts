import { z } from "zod";
import { rideStatusValues } from "../../shared";

export const RideStatusSchema = z.enum(rideStatusValues);
export type RideStatus = z.infer<typeof RideStatusSchema>;
