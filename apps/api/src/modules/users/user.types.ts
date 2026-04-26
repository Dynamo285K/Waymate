import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import type { users } from "../../db/schema/user";

export type User = InferSelectModel<typeof users>;
export type UserInsert = InferInsertModel<typeof users>;

export type OnboardingUserBody = Pick<
    UserInsert,
    "firstName" | "lastName" | "phone"
>;

export type UpdateUserBody = Partial<
    Pick<
        UserInsert,
        | "firstName"
        | "lastName"
        | "displayName"
        | "phone"
        | "bio"
        | "profilePhotoUrl"
    >
>;
