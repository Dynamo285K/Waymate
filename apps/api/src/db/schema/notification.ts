import { index, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { users } from "./user";
import { deliveryStatusEnum, notificationTypeEnum } from "./enums";
import { timestamptz } from "./timestamps";

export const notifications = pgTable(
    "notifications",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        userId: uuid("user_id")
            .notNull()
            .references(() => users.id),
        notificationType: notificationTypeEnum("notification_type").notNull(),
        referenceEntityType: text("reference_entity_type"),
        referenceEntityId: uuid("reference_entity_id"),
        title: text("title").notNull(),
        body: text("body").notNull(),
        deliveryStatus: deliveryStatusEnum("delivery_status").notNull(),
        readAt: timestamptz("read_at"),
        sentAt: timestamptz("sent_at"),
        createdAt: timestamptz("created_at").defaultNow().notNull(),
        updatedAt: timestamptz("updated_at").defaultNow().notNull(),
    },
    (table) => [
        index("notifications_user_id_idx").on(table.userId),
        index("notifications_type_idx").on(table.notificationType),
        index("notifications_delivery_status_idx").on(table.deliveryStatus),
        index("notifications_read_at_idx").on(table.readAt),
        index("notifications_created_at_idx").on(table.createdAt),
    ]
);
