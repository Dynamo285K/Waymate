import { z } from "zod";
import { BookingIdSchema } from "./booking-id.schema";
import { UserIdSchema } from "../users/user-id.schema";
import { BookingStatusSchema } from "./booking-statuses.schema";

export const BookingStatusHistoryIdSchema = z.uuid();

export const BookingStatusHistoryEntitySchema = z.object({
    // Identity and relationships
    id: BookingStatusHistoryIdSchema,
    booking_id: BookingIdSchema,

    // Status transition
    old_status: BookingStatusSchema.nullable(),
    new_status: BookingStatusSchema,
    changed_by_user_id: UserIdSchema.nullable(),
    reason: z.string().max(500).nullable(),

    // Timestamps
    created_at: z.date(),
});

export type BookingStatusHistory = z.infer<
    typeof BookingStatusHistoryEntitySchema
>;
