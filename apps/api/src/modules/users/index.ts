/**
 * Users domain schema module.
 *
 * Scope in Zod:
 * - users entity fields (output — validating data read from DB)
 * - users input fields (input — normalizing and validating user-submitted data)
 * - user status enum values
 * - user_status_history entity fields
 *
 * Constraints intentionally outside Zod:
 * - DB-only: case-insensitive email uniqueness (e.g. UNIQUE INDEX ON lower(email))
 * - Transaction-only: atomic consistency between users.user_status and user_status_history writes
 */
export * from "./user.schema";
