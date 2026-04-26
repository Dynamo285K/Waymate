import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import type { users } from "../../db/schema/user";

// ==========================================
// 1. BASE DATABASE TYPES (SELECT - what the DB returns)
// ==========================================
export type User = InferSelectModel<typeof users>;

// ==========================================
// 2. DATABASE TYPES FOR INSERTION (INSERT)
// ==========================================
export type UserInsert = InferInsertModel<typeof users>;

// ==========================================
// 3. SPECIFIC PROPERTIES AND ALIASES
// ==========================================
export type UserStatus = User["userStatus"];

// ==========================================
// 4. SERVICE / REPOSITORY CONTRACTS (COMPOSITE TYPES)
// ==========================================

export type OnboardingUserInput = Pick<UserInsert, "firstName" | "lastName"> &
    Partial<Pick<UserInsert, "phone" | "bio">>;

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
