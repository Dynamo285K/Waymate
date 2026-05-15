import { sql } from "drizzle-orm";
import { check, index, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { reports } from "./report";
import { users } from "./user";
import { reportStatusEnum } from "./enums";
import { timestamptz } from "./timestamps";

export const reportStatusHistory = pgTable(
    "report_status_history",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        reportId: uuid("report_id")
            .notNull()
            .references(() => reports.id),
        oldStatus: reportStatusEnum("old_status"),
        newStatus: reportStatusEnum("new_status").notNull(),
        changedByUserId: uuid("changed_by_user_id").references(() => users.id),
        reason: text("reason"),
        createdAt: timestamptz("created_at").defaultNow().notNull(),
    },
    (table) => [
        index("report_status_history_report_id_idx").on(table.reportId),
        index("report_status_history_new_status_idx").on(table.newStatus),
        index("report_status_history_created_at_idx").on(table.createdAt),

        check(
            "report_status_history_reason_len_chk",
            sql`${table.reason} IS NULL OR char_length(${table.reason}) <= 500`
        ),
    ]
);
