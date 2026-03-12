import { z } from "zod";
import { BookingIdSchema } from "./booking-id.schema";
import { UserIdSchema } from "../../users/schemas/user.schema";
import { BookingStatusIdSchema } from "./booking-statuses.schema";

export const BookingStatusHistoryIdSchema = z.uuid();

export const BookingStatusHistoryEntitySchema = z.object({
    id: BookingStatusHistoryIdSchema,
    booking_id: BookingIdSchema,
    old_status_id: BookingStatusIdSchema.nullable(),
    new_status_id: BookingStatusIdSchema,
    changed_by_user_id: UserIdSchema.nullable(),
    reason: z.string().nullable(),
    created_at: z.date(),
});

export type BookingStatusHistory = z.infer<
    typeof BookingStatusHistoryEntitySchema
>;
