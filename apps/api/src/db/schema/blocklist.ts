import { sql } from "drizzle-orm";
import { check, index, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { users } from "./user";
import { blockReasonEnum, blockStatusEnum } from "./enums";
import { timestamptz } from "./timestamps";

export const blocklist = pgTable(
    "blocklist",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        blockerUserId: uuid("blocker_user_id")
            .notNull()
            .references(() => users.id),
        blockedUserId: uuid("blocked_user_id")
            .notNull()
            .references(() => users.id),
        blockReason: blockReasonEnum("block_reason").notNull(),
        blockStatus: blockStatusEnum("block_status").notNull(),
        reasonText: text("reason_text"),
        revokedAt: timestamptz("revoked_at"),
        revokedByUserId: uuid("revoked_by_user_id").references(() => users.id),
        createdAt: timestamptz("created_at").defaultNow().notNull(),
        updatedAt: timestamptz("updated_at").defaultNow().notNull(),
        deletedAt: timestamptz("deleted_at"),
    },
    (table) => [
        index("blocklist_blocker_user_id_idx").on(table.blockerUserId),
        index("blocklist_blocked_user_id_idx").on(table.blockedUserId),
        index("blocklist_reason_idx").on(table.blockReason),
        index("blocklist_status_idx").on(table.blockStatus),
        index("blocklist_created_at_idx").on(table.createdAt),
        check(
            "blocklist_no_self_block_chk",
            sql`${table.blockerUserId} <> ${table.blockedUserId}`
        ),
        check(
            "blocklist_revoked_at_chk",
            sql`${table.revokedAt} IS NULL OR ${table.revokedAt} >= ${table.createdAt}`
        ),
        check(
            "blocklist_reason_text_len_chk",
            sql`${table.reasonText} IS NULL OR char_length(trim(${table.reasonText})) <= 500`
        ),
    ]
);
