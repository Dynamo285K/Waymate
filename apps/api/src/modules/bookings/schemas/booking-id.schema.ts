import { z } from "zod";

export const BookingIdSchema = z.uuid();

export type BookingId = z.infer<typeof BookingIdSchema>;
