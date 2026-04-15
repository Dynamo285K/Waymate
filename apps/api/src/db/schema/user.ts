import { sql } from "drizzle-orm";
import {
    check,
    index,
    pgTable,
    text,
    timestamp,
    boolean,
    uniqueIndex,
    uuid,
} from "drizzle-orm/pg-core";
import { userStatusEnum } from "./enums";

export const users = pgTable(
    "users",
    {
        // --- 1. BETTER-AUTH REQUIRED COLUMNS ---
        id: uuid("id").primaryKey().defaultRandom(),
        name: text("name").notNull(),
        email: text("email").notNull().unique(),
        emailVerified: boolean("email_verified").notNull().default(false),
        image: text("image"),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at").defaultNow().notNull(),

        // --- 2. CUSTOM WAYMATE COLUMNS ---
        firstName: text("first_name"),
        lastName: text("last_name"),
        displayName: text("display_name"),
        phone: text("phone"),
        profilePhotoUrl: text("profile_photo_url"), // You can keep this, or just use the required 'image' above
        bio: text("bio"),
        emailVerifiedAt: timestamp("email_verified_at"), // Kept for your historical tracking
        phoneVerifiedAt: timestamp("phone_verified_at"),
        lastActiveAt: timestamp("last_active_at"),
        userStatus: userStatusEnum("user_status").notNull().default("ACTIVE"),
        deletedAt: timestamp("deleted_at"),
    },
    (table) => [
        uniqueIndex("user_email_lower_uq").on(sql`lower(${table.email})`),
        index("user_status_idx").on(table.userStatus),
        index("user_created_at_idx").on(table.createdAt),

        check("user_email_len_chk", sql`char_length(${table.email}) <= 254`),

        check(
            "user_first_name_len_chk",
            sql`char_length(${table.firstName}) BETWEEN 1 AND 20`
        ),
        check(
            "user_last_name_len_chk",
            sql`char_length(${table.lastName}) BETWEEN 1 AND 20`
        ),
        check(
            "user_display_name_len_chk",
            sql`char_length(${table.displayName}) BETWEEN 1 AND 20`
        ),
        check(
            "user_first_name_format_chk",
            sql`${table.firstName} ~ '^[[:upper:]]' AND ${table.firstName} !~ '\\s'`
        ),
        check(
            "user_last_name_format_chk",
            sql`${table.lastName} ~ '^[[:upper:]]' AND ${table.lastName} !~ '\\s'`
        ),
        check(
            "user_display_name_no_space_chk",
            sql`${table.displayName} !~ '\\s'`
        ),
        check(
            "user_phone_format_chk",
            sql`${table.phone} IS NULL OR (${table.phone} ~ '^\\+[1-9][0-9]{1,14}$' AND char_length(${table.phone}) <= 16)`
        ),
        check(
            "user_bio_len_chk",
            sql`${table.bio} IS NULL OR char_length(${table.bio}) <= 500`
        ),
    ]
);
