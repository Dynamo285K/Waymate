import { sql } from "drizzle-orm";
import {
    check,
    index,
    pgTable,
    text,
    boolean,
    uniqueIndex,
    uuid,
} from "drizzle-orm/pg-core";
import { userRoleEnum, userStatusEnum } from "./enums";
import { timestamptz } from "./timestamps";

export const users = pgTable(
    "users",
    {
        // better-auth required columns
        id: uuid("id").primaryKey().defaultRandom(),
        name: text("name").notNull(),
        email: text("email").notNull(),
        emailVerified: boolean("email_verified").notNull().default(false),
        image: text("image"),
        createdAt: timestamptz("created_at").defaultNow().notNull(),
        updatedAt: timestamptz("updated_at").defaultNow().notNull(),

        // custom Waymate columns
        firstName: text("first_name"),
        lastName: text("last_name"),
        displayName: text("display_name"),
        phone: text("phone"),
        profilePhotoUrl: text("profile_photo_url"),
        bio: text("bio"),
        emailVerifiedAt: timestamptz("email_verified_at"),
        phoneVerifiedAt: timestamptz("phone_verified_at"),
        lastActiveAt: timestamptz("last_active_at"),
        userStatus: userStatusEnum("user_status").notNull().default("ACTIVE"),
        userRole: userRoleEnum("user_role").notNull().default("USER"),
        // better-auth admin plugin columns
        banned: boolean("banned").notNull().default(false),
        banReason: text("ban_reason"),
        banExpires: timestamptz("ban_expires"),
        deletedAt: timestamptz("deleted_at"),
    },
    (table) => [
        // Partial unique index on the lower-cased email scoped to live rows
        // — soft-deleted users must not block re-registration of the same
        // address. There is no plain unique constraint on `email`; this index
        // is the only uniqueness gate.
        uniqueIndex("user_email_lower_uq")
            .on(sql`lower(${table.email})`)
            .where(sql`${table.deletedAt} IS NULL`),
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
