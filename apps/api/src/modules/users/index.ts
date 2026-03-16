/**
 * Users domain schema module.
 *
 * Scope in Zod:
 * - users entity fields (output — validating data read from DB)
 * - users input fields (input — normalizing and validating user-submitted data)
 * - user_statuses lookup values
 * - user_status_history entity fields
 *
 * Constraints intentionally outside Zod:
 * - DB-only: case-insensitive email uniqueness (e.g. UNIQUE INDEX ON lower(email))
 * - Transaction-only: aggregate synchronization (avg_rating, rating_count)
 * - Transaction-only: atomic consistency between users.user_status_id and user_status_history writes
 */
export * from "./user-id.schema";
export * from "./user.schema";
export * from "./user-output.schema";
export * from "./user-input.schema";
export * from "./user-statuses.schema";
export * from "./user-status-history.schema";
