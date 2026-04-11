import { z } from "zod";
import { bookingStatusValues } from "../../shared";

export const BookingStatusSchema = z.enum(bookingStatusValues);
export type BookingStatus = z.infer<typeof BookingStatusSchema>;
