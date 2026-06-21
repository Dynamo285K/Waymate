import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import type { users } from "../../db/schema/user";

export type User = InferSelectModel<typeof users>;

export type UserInsert = InferInsertModel<typeof users>;

export type UserStatus = User["userStatus"];

export type OnboardingUserInput = Pick<
    UserInsert,
    "firstName" | "lastName" | "phone"
>;

export type UpdateUserInput = Partial<
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
