import {
    aliasedTable,
    and,
    desc,
    eq,
    gte,
    ilike,
    isNull,
    lt,
    lte,
    ne,
    or,
    sql,
} from "drizzle-orm";
import type {
    AdminReviewDetail,
    AdminReviewListItem,
    AdminReviewStatusHistoryItem,
    ReviewStatus,
} from "@repo/shared";
import type { Executor } from "../../../db";
import { users as usersTable } from "../../../db/schema/user";
import { rides as ridesTable } from "../../../db/schema/ride";
import { rideStops as rideStopsTable } from "../../../db/schema/ride_stop";
import { reviews as reviewsTable } from "../../../db/schema/review";
import { reviewStatusHistory as reviewStatusHistoryTable } from "../../../db/schema/review_status_history";

const findReviewList = async (
    executor: Executor,
    params: {
        limit: number;
        status?: ReviewStatus;
        minRating?: number;
        maxRating?: number;
        subjectRole?: "DRIVER" | "PASSENGER";
        search?: string;
        cursorPosition?: { id: string; createdAt: Date };
    }
): Promise<AdminReviewListItem[]> => {
    const author = aliasedTable(usersTable, "admin_review_author");
    const subject = aliasedTable(usersTable, "admin_review_subject");
    const originStops = aliasedTable(rideStopsTable, "admin_rl_origin_stops");
    const destStops = aliasedTable(rideStopsTable, "admin_rl_dest_stops");

    const lastStopOrders = executor
        .select({
            rideId: rideStopsTable.rideId,
            stopOrder: sql<number>`MAX(${rideStopsTable.stopOrder})`.as(
                "stopOrder"
            ),
        })
        .from(rideStopsTable)
        .groupBy(rideStopsTable.rideId)
        .as("admin_rl_last_stops");

    const conditions = [
        isNull(author.deletedAt),
        ne(author.userRole, "ADMIN"),
        isNull(reviewsTable.deletedAt),
    ];

    if (params.status) {
        conditions.push(eq(reviewsTable.reviewStatus, params.status));
    }
    if (params.minRating !== undefined) {
        conditions.push(gte(reviewsTable.rating, params.minRating));
    }
    if (params.maxRating !== undefined) {
        conditions.push(lte(reviewsTable.rating, params.maxRating));
    }
    if (params.subjectRole === "DRIVER") {
        conditions.push(ne(reviewsTable.authorId, ridesTable.driverId));
    } else if (params.subjectRole === "PASSENGER") {
        conditions.push(eq(reviewsTable.authorId, ridesTable.driverId));
    }
    if (params.search) {
        const pattern = `%${params.search}%`;
        const searchClause = or(
            ilike(reviewsTable.comment, pattern),
            ilike(author.email, pattern),
            ilike(author.firstName, pattern),
            ilike(author.lastName, pattern),
            ilike(subject.email, pattern),
            ilike(subject.firstName, pattern),
            ilike(subject.lastName, pattern)
        );
        if (searchClause) conditions.push(searchClause);
    }
    if (params.cursorPosition) {
        const cursorClause = or(
            lt(reviewsTable.createdAt, params.cursorPosition.createdAt),
            and(
                eq(reviewsTable.createdAt, params.cursorPosition.createdAt),
                lt(reviewsTable.id, params.cursorPosition.id)
            )
        );
        if (cursorClause) conditions.push(cursorClause);
    }

    const rows = await executor
        .select({
            id: reviewsTable.id,
            rideId: reviewsTable.rideId,
            rating: reviewsTable.rating,
            comment: reviewsTable.comment,
            reviewStatus: reviewsTable.reviewStatus,
            createdAt: reviewsTable.createdAt,
            authorIsDriver:
                sql<boolean>`${reviewsTable.authorId} = ${ridesTable.driverId}`.as(
                    "author_is_driver"
                ),
            originCity: originStops.city,
            destinationCity: destStops.city,
            authorId: author.id,
            authorEmail: author.email,
            authorFirstName: author.firstName,
            authorLastName: author.lastName,
            authorProfilePhotoUrl: author.profilePhotoUrl,
            subjectId: subject.id,
            subjectEmail: subject.email,
            subjectFirstName: subject.firstName,
            subjectLastName: subject.lastName,
            subjectProfilePhotoUrl: subject.profilePhotoUrl,
        })
        .from(reviewsTable)
        .innerJoin(author, eq(reviewsTable.authorId, author.id))
        .innerJoin(subject, eq(reviewsTable.subjectId, subject.id))
        .innerJoin(ridesTable, eq(reviewsTable.rideId, ridesTable.id))
        .innerJoin(
            originStops,
            and(
                eq(originStops.rideId, ridesTable.id),
                eq(originStops.stopOrder, 0)
            )
        )
        .innerJoin(lastStopOrders, eq(lastStopOrders.rideId, ridesTable.id))
        .innerJoin(
            destStops,
            and(
                eq(destStops.rideId, ridesTable.id),
                eq(destStops.stopOrder, lastStopOrders.stopOrder)
            )
        )
        .where(and(...conditions))
        .orderBy(desc(reviewsTable.createdAt), desc(reviewsTable.id))
        .limit(params.limit);

    return rows.map((row) => ({
        id: row.id,
        rideId: row.rideId,
        rating: row.rating,
        comment: row.comment,
        reviewStatus: row.reviewStatus,
        authorRole: row.authorIsDriver ? "DRIVER" : "PASSENGER",
        subjectRole: row.authorIsDriver ? "PASSENGER" : "DRIVER",
        author: {
            id: row.authorId,
            email: row.authorEmail,
            firstName: row.authorFirstName,
            lastName: row.authorLastName,
            profilePhotoUrl: row.authorProfilePhotoUrl,
        },
        subject: {
            id: row.subjectId,
            email: row.subjectEmail,
            firstName: row.subjectFirstName,
            lastName: row.subjectLastName,
            profilePhotoUrl: row.subjectProfilePhotoUrl,
        },
        ride: {
            originCity: row.originCity,
            destinationCity: row.destinationCity,
        },
        createdAt: row.createdAt,
    }));
};

const findReviewCounts = async (
    executor: Executor
): Promise<{ all: number; visible: number; hidden: number }> => {
    const author = aliasedTable(usersTable, "review_count_author");

    const [row] = await executor
        .select({
            all: sql<number>`COUNT(*) FILTER (WHERE ${reviewsTable.deletedAt} IS NULL)::int`,
            visible: sql<number>`COUNT(*) FILTER (WHERE ${reviewsTable.reviewStatus} = 'VISIBLE' AND ${reviewsTable.deletedAt} IS NULL)::int`,
            hidden: sql<number>`COUNT(*) FILTER (WHERE ${reviewsTable.reviewStatus} = 'HIDDEN' AND ${reviewsTable.deletedAt} IS NULL)::int`,
        })
        .from(reviewsTable)
        .innerJoin(author, eq(reviewsTable.authorId, author.id))
        .where(and(isNull(author.deletedAt), ne(author.userRole, "ADMIN")));

    return row ?? { all: 0, visible: 0, hidden: 0 };
};

const findReviewCreatedAt = async (
    executor: Executor,
    id: string
): Promise<Date | null> => {
    const [row] = await executor
        .select({ createdAt: reviewsTable.createdAt })
        .from(reviewsTable)
        .where(eq(reviewsTable.id, id))
        .limit(1);
    return row?.createdAt ?? null;
};

const findReviewDetailById = async (
    executor: Executor,
    id: string
): Promise<AdminReviewDetail | null> => {
    const author = aliasedTable(usersTable, "admin_review_detail_author");
    const subject = aliasedTable(usersTable, "admin_review_detail_subject");
    const originStops = aliasedTable(
        rideStopsTable,
        "admin_review_detail_origin"
    );
    const destStops = aliasedTable(rideStopsTable, "admin_review_detail_dest");

    const lastStopOrders = executor
        .select({
            rideId: rideStopsTable.rideId,
            stopOrder: sql<number>`MAX(${rideStopsTable.stopOrder})`.as(
                "stopOrder"
            ),
        })
        .from(rideStopsTable)
        .groupBy(rideStopsTable.rideId)
        .as("admin_review_detail_last_stops");

    const [row] = await executor
        .select({
            id: reviewsTable.id,
            rideId: reviewsTable.rideId,
            rating: reviewsTable.rating,
            comment: reviewsTable.comment,
            reviewStatus: reviewsTable.reviewStatus,
            createdAt: reviewsTable.createdAt,
            updatedAt: reviewsTable.updatedAt,
            authorIsDriver:
                sql<boolean>`${reviewsTable.authorId} = ${ridesTable.driverId}`.as(
                    "detail_author_is_driver"
                ),
            authorId: author.id,
            authorEmail: author.email,
            authorFirstName: author.firstName,
            authorLastName: author.lastName,
            authorProfilePhotoUrl: author.profilePhotoUrl,
            subjectId: subject.id,
            subjectEmail: subject.email,
            subjectFirstName: subject.firstName,
            subjectLastName: subject.lastName,
            subjectProfilePhotoUrl: subject.profilePhotoUrl,
            rideDepartureAt: ridesTable.departureAt,
            originCity: originStops.city,
            destinationCity: destStops.city,
        })
        .from(reviewsTable)
        .innerJoin(author, eq(reviewsTable.authorId, author.id))
        .innerJoin(subject, eq(reviewsTable.subjectId, subject.id))
        .innerJoin(ridesTable, eq(reviewsTable.rideId, ridesTable.id))
        .innerJoin(
            originStops,
            and(
                eq(originStops.rideId, ridesTable.id),
                eq(originStops.stopOrder, 0)
            )
        )
        .innerJoin(lastStopOrders, eq(lastStopOrders.rideId, ridesTable.id))
        .innerJoin(
            destStops,
            and(
                eq(destStops.rideId, ridesTable.id),
                eq(destStops.stopOrder, lastStopOrders.stopOrder)
            )
        )
        .where(
            and(
                eq(reviewsTable.id, id),
                isNull(reviewsTable.deletedAt),
                isNull(author.deletedAt),
                ne(author.userRole, "ADMIN")
            )
        )
        .limit(1);

    if (!row) return null;

    return {
        id: row.id,
        rideId: row.rideId,
        rating: row.rating,
        comment: row.comment,
        reviewStatus: row.reviewStatus,
        authorRole: row.authorIsDriver ? "DRIVER" : "PASSENGER",
        subjectRole: row.authorIsDriver ? "PASSENGER" : "DRIVER",
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        author: {
            id: row.authorId,
            email: row.authorEmail,
            firstName: row.authorFirstName,
            lastName: row.authorLastName,
            profilePhotoUrl: row.authorProfilePhotoUrl,
        },
        subject: {
            id: row.subjectId,
            email: row.subjectEmail,
            firstName: row.subjectFirstName,
            lastName: row.subjectLastName,
            profilePhotoUrl: row.subjectProfilePhotoUrl,
        },
        ride: {
            id: row.rideId,
            departureAt: row.rideDepartureAt,
            originCity: row.originCity,
            destinationCity: row.destinationCity,
        },
    };
};

const deleteReviewById = async (
    executor: Executor,
    id: string
): Promise<{ id: string } | null> => {
    const [deleted] = await executor
        .update(reviewsTable)
        .set({ deletedAt: new Date() })
        .where(and(eq(reviewsTable.id, id), isNull(reviewsTable.deletedAt)))
        .returning({ id: reviewsTable.id });

    return deleted ?? null;
};

const findReviewStatusHistoryByReviewId = async (
    executor: Executor,
    reviewId: string,
    limit: number
): Promise<AdminReviewStatusHistoryItem[]> => {
    const actor = aliasedTable(usersTable, "review_history_actor");

    const rows = await executor
        .select({
            id: reviewStatusHistoryTable.id,
            oldStatus: reviewStatusHistoryTable.oldStatus,
            newStatus: reviewStatusHistoryTable.newStatus,
            reason: reviewStatusHistoryTable.reason,
            createdAt: reviewStatusHistoryTable.createdAt,
            actorId: actor.id,
            actorFirstName: actor.firstName,
            actorLastName: actor.lastName,
        })
        .from(reviewStatusHistoryTable)
        .leftJoin(actor, eq(reviewStatusHistoryTable.changedByUserId, actor.id))
        .where(eq(reviewStatusHistoryTable.reviewId, reviewId))
        .orderBy(desc(reviewStatusHistoryTable.createdAt))
        .limit(limit);

    return rows.map((row) => ({
        id: row.id,
        oldStatus: row.oldStatus,
        newStatus: row.newStatus,
        reason: row.reason,
        createdAt: row.createdAt,
        changedBy: row.actorId
            ? {
                  id: row.actorId,
                  firstName: row.actorFirstName,
                  lastName: row.actorLastName,
              }
            : null,
    }));
};

const findReviewForAdminUpdate = async (
    executor: Executor,
    id: string
): Promise<{ reviewStatus: ReviewStatus } | null> => {
    const author = aliasedTable(usersTable, "admin_review_update_author");
    const [row] = await executor
        .select({ reviewStatus: reviewsTable.reviewStatus })
        .from(reviewsTable)
        .innerJoin(author, eq(reviewsTable.authorId, author.id))
        .where(
            and(
                eq(reviewsTable.id, id),
                isNull(reviewsTable.deletedAt),
                isNull(author.deletedAt),
                ne(author.userRole, "ADMIN")
            )
        )
        .limit(1);
    return row ?? null;
};

const updateReviewStatusById = async (
    executor: Executor,
    id: string,
    status: ReviewStatus
): Promise<{ id: string } | null> => {
    const [updated] = await executor
        .update(reviewsTable)
        .set({ reviewStatus: status })
        .where(eq(reviewsTable.id, id))
        .returning({ id: reviewsTable.id });
    return updated ?? null;
};

const insertReviewStatusHistoryRow = async (
    executor: Executor,
    values: {
        reviewId: string;
        oldStatus: ReviewStatus | null;
        newStatus: ReviewStatus;
        changedByUserId: string;
        reason: string;
    }
): Promise<void> => {
    await executor.insert(reviewStatusHistoryTable).values(values);
};

export const AdminReviewRepository = {
    findReviewList,
    findReviewCounts,
    findReviewCreatedAt,
    findReviewDetailById,
    findReviewStatusHistoryByReviewId,
    findReviewForAdminUpdate,
    updateReviewStatusById,
    insertReviewStatusHistoryRow,
    deleteReviewById,
};
