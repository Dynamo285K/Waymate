import { sql } from "drizzle-orm";
import {
    check,
    index,
    pgTable,
    text,
    timestamp,
    uuid,
    uniqueIndex,
} from "drizzle-orm/pg-core";
import { userStatusEnum } from "./enums";

export const users = pgTable(
    "users",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        email: text("email").notNull(),
        passwordHash: text("password_hash").notNull(),
        firstName: text("first_name").notNull(),
        lastName: text("last_name").notNull(),
        displayName: text("display_name").notNull(),
        phone: text("phone"),
        profilePhotoUrl: text("profile_photo_url"),
        bio: text("bio"),
        emailVerifiedAt: timestamp("email_verified_at"),
        phoneVerifiedAt: timestamp("phone_verified_at"),
        lastActiveAt: timestamp("last_active_at"),
        userStatus: userStatusEnum("user_status").notNull(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at").defaultNow().notNull(),
        deletedAt: timestamp("deleted_at"),
    },
    (table) => [
        uniqueIndex("users_email_lower_uq").on(sql`lower(${table.email})`),
        index("users_status_idx").on(table.userStatus),
        index("users_created_at_idx").on(table.createdAt),

        check("users_email_len_chk", sql`char_length(${table.email}) <= 254`),
        check(
            "users_password_hash_len_chk",
            sql`char_length(${table.passwordHash}) BETWEEN 1 AND 255`
        ),
        check(
            "users_first_name_len_chk",
            sql`char_length(${table.firstName}) BETWEEN 1 AND 20`
        ),
        check(
            "users_last_name_len_chk",
            sql`char_length(${table.lastName}) BETWEEN 1 AND 20`
        ),
        check(
            "users_display_name_len_chk",
            sql`char_length(${table.displayName}) BETWEEN 1 AND 20`
        ),
        check(
            "users_first_name_format_chk",
            sql`${table.firstName} ~ '^[[:upper:]]' AND ${table.firstName} !~ '\\s'`
        ),
        check(
            "users_last_name_format_chk",
            sql`${table.lastName} ~ '^[[:upper:]]' AND ${table.lastName} !~ '\\s'`
        ),
        check(
            "users_display_name_no_space_chk",
            sql`${table.displayName} !~ '\\s'`
        ),
        check(
            "users_phone_format_chk",
            sql`${table.phone} IS NULL OR (${table.phone} ~ '^\\+[1-9][0-9]{1,14}$' AND char_length(${table.phone}) <= 16)`
        ),
        check(
            "users_bio_len_chk",
            sql`${table.bio} IS NULL OR char_length(${table.bio}) <= 500`
        ),
    ]
);
