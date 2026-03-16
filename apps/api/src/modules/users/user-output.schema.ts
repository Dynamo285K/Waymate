import { z } from "zod";
import { UserEntitySchema } from "./user.schema";

export const UserOutputSchema = UserEntitySchema.pick({
    id: true,
    email: true,
    user_status_id: true,

    first_name: true,
    last_name: true,
    display_name: true,
    phone: true,
    profile_photo_url: true,
    bio: true,

    avg_rating: true,
    rating_count: true,
    completed_rides_count: true,
    no_show_count: true,

    email_verified_at: true,
    phone_verified_at: true,
    last_active_at: true,

    created_at: true,
});

export type UserOutput = z.infer<typeof UserOutputSchema>;
