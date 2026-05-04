import { pgTable } from "drizzle-orm/pg-core";
import * as t from "drizzle-orm/pg-core";
import { users } from "./user";

export const sessions = pgTable("sessions", {
    id: t.uuid("id").primaryKey(),
    userId: t
        .uuid("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    token: t.varchar("token", { length: 255 }).notNull().unique(),
    expiresAt: t
        .timestamp("expires_at", { precision: 6, withTimezone: true })
        .notNull(),
    ipAddress: t.text("ip_address"),
    userAgent: t.text("user_agent"),
    createdAt: t
        .timestamp("created_at", { precision: 6, withTimezone: true })
        .notNull(),
    updatedAt: t
        .timestamp("updated_at", { precision: 6, withTimezone: true })
        .notNull(),
    impersonatedBy: t.uuid("impersonated_by"),
});
