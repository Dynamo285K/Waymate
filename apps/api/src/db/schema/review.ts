import { sql } from "drizzle-orm";
import {
    check,
    index,
    integer,
    pgTable,
    text,
    timestamp,
    uniqueIndex,
    uuid,
} from "drizzle-orm/pg-core";
import { rides } from "./ride";
import { users } from "./user";
import { reviewStatusEnum } from "./enums";

export const reviews = pgTable(
    "reviews",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        rideId: uuid("ride_id")
            .notNull()
            .references(() => rides.id),
        authorId: uuid("author_id")
            .notNull()
            .references(() => users.id),
        subjectId: uuid("subject_id")
            .notNull()
            .references(() => users.id),
        rating: integer("rating").notNull(),
        comment: text("comment"),
        reviewStatus: reviewStatusEnum("review_status").notNull(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at").defaultNow().notNull(),
    },
    (table) => [
        uniqueIndex("reviews_ride_author_subject_uq").on(
            table.rideId,
            table.authorId,
            table.subjectId
        ),
        index("reviews_subject_id_idx").on(table.subjectId),
        index("reviews_rating_idx").on(table.rating),
        index("reviews_status_idx").on(table.reviewStatus),
        index("reviews_created_at_idx").on(table.createdAt),

        check("reviews_rating_chk", sql`${table.rating} BETWEEN 1 AND 5`),
        check(
            "reviews_author_subject_distinct_chk",
            sql`${table.authorId} <> ${table.subjectId}`
        ),
    ]
);
