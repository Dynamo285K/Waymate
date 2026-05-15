import { sql } from "drizzle-orm";
import { check, index, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { users } from "./user";
import { rides } from "./ride";
import { reportStatusEnum, reportTypeEnum } from "./enums";
import { timestamptz } from "./timestamps";

export const reports = pgTable(
    "reports",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        reporterId: uuid("reporter_id")
            .notNull()
            .references(() => users.id),
        targetUserId: uuid("target_user_id")
            .notNull()
            .references(() => users.id),
        rideId: uuid("ride_id").references(() => rides.id),
        reportType: reportTypeEnum("report_type").notNull(),
        reportStatus: reportStatusEnum("report_status")
            .notNull()
            .default("OPEN"),
        description: text("description").notNull(),
        resolutionReason: text("resolution_reason"),
        createdAt: timestamptz("created_at").defaultNow().notNull(),
        updatedAt: timestamptz("updated_at").defaultNow().notNull(),
        deletedAt: timestamptz("deleted_at"),
    },
    (table) => [
        index("reports_target_user_id_idx").on(table.targetUserId),
        index("reports_reporter_id_idx").on(table.reporterId),
        index("reports_status_idx").on(table.reportStatus),
        index("reports_created_at_idx").on(table.createdAt),

        check(
            "reports_description_len_chk",
            sql`char_length(${table.description}) BETWEEN 1 AND 2000`
        ),
        check(
            "reports_resolution_reason_len_chk",
            sql`${table.resolutionReason} IS NULL OR char_length(${table.resolutionReason}) <= 500`
        ),
    ]
);
