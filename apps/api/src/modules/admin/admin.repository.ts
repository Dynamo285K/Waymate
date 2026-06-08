import {
    aliasedTable,
    and,
    asc,
    desc,
    eq,
    gte,
    ilike,
    inArray,
    isNull,
    lt,
    lte,
    ne,
    or,
    sql,
} from "drizzle-orm";
import type {
    AdminDashboardResponse,
    AdminReportDetail,
    AdminReportListItem,
    AdminReportStatusHistoryItem,
    AdminReviewDetail,
    AdminReviewListItem,
    AdminReviewStatusHistoryItem,
    AdminRideDetail,
    AdminRideListItem,
    AdminRideStatusHistoryItem,
    AdminUserDetail,
    AdminUserListItem,
    AdminUserStatusHistoryItem,
    ReportStatus,
    ReportType,
    ReviewStatus,
    RideStatus,
    UserStatus,
} from "@repo/shared";
import type { Executor } from "../../db";
import { users as usersTable } from "../../db/schema/user";
import { userStatusHistory as userStatusHistoryTable } from "../../db/schema/user_status_history";
import { rides as ridesTable } from "../../db/schema/ride";
import { rideStops as rideStopsTable } from "../../db/schema/ride_stop";
import { prices as pricesTable } from "../../db/schema/price";
import { bookings as bookingsTable } from "../../db/schema/booking";
import { cars as carsTable } from "../../db/schema/car";
import { carModels as carModelsTable } from "../../db/schema/car_model";
import { sessions as sessionsTable } from "../../db/schema/session";
import { rideStatusHistory as rideStatusHistoryTable } from "../../db/schema/ride_status_history";
import { reviews as reviewsTable } from "../../db/schema/review";
import { reviewStatusHistory as reviewStatusHistoryTable } from "../../db/schema/review_status_history";
import { reports as reportsTable } from "../../db/schema/report";
import { reportStatusHistory as reportStatusHistoryTable } from "../../db/schema/report_status_history";

const adminUserListColumns = {
    id: usersTable.id,
    email: usersTable.email,
    firstName: usersTable.firstName,
    lastName: usersTable.lastName,
    userRole: usersTable.userRole,
    userStatus: usersTable.userStatus,
    createdAt: usersTable.createdAt,
    lastActiveAt: usersTable.lastActiveAt,
} as const;

const adminUserDetailColumns = {
    id: usersTable.id,
    email: usersTable.email,
    firstName: usersTable.firstName,
    lastName: usersTable.lastName,
    displayName: usersTable.displayName,
    phone: usersTable.phone,
    bio: usersTable.bio,
    profilePhotoUrl: usersTable.profilePhotoUrl,
    userRole: usersTable.userRole,
    userStatus: usersTable.userStatus,
    emailVerifiedAt: usersTable.emailVerifiedAt,
    phoneVerifiedAt: usersTable.phoneVerifiedAt,
    lastActiveAt: usersTable.lastActiveAt,
    createdAt: usersTable.createdAt,
    updatedAt: usersTable.updatedAt,
} as const;

// Admin tooling manages USER-role accounts only; the seeded admin is
// intentionally invisible/uneditable here. Apply to every query or update
// in this module that touches the users table.
const visibleUserConditions = [
    isNull(usersTable.deletedAt),
    ne(usersTable.userRole, "ADMIN"),
];

const findUserList = async (
    executor: Executor,
    params: {
        limit: number;
        search?: string;
        cursorPosition?: { id: string; createdAt: Date };
    }
): Promise<AdminUserListItem[]> => {
    const conditions = [...visibleUserConditions];

    if (params.search) {
        const pattern = `%${params.search}%`;
        const searchClause = or(
            ilike(usersTable.email, pattern),
            ilike(usersTable.firstName, pattern),
            ilike(usersTable.lastName, pattern)
        );
        if (searchClause) conditions.push(searchClause);
    }

    if (params.cursorPosition) {
        const cursorClause = or(
            lt(usersTable.createdAt, params.cursorPosition.createdAt),
            and(
                eq(usersTable.createdAt, params.cursorPosition.createdAt),
                lt(usersTable.id, params.cursorPosition.id)
            )
        );
        if (cursorClause) conditions.push(cursorClause);
    }

    return await executor
        .select(adminUserListColumns)
        .from(usersTable)
        .where(and(...conditions))
        .orderBy(desc(usersTable.createdAt), desc(usersTable.id))
        .limit(params.limit);
};

// Looks up just enough state to anchor a keyset cursor — no visibility filter
// here on purpose: a cursor was issued from a previously visible row, and the
// caller (service) decides what to do when the row no longer resolves.
const findUserCreatedAt = async (
    executor: Executor,
    id: string
): Promise<Date | null> => {
    const [row] = await executor
        .select({ createdAt: usersTable.createdAt })
        .from(usersTable)
        .where(eq(usersTable.id, id))
        .limit(1);

    return row?.createdAt ?? null;
};

const findUserById = async (
    executor: Executor,
    id: string
): Promise<AdminUserListItem | null> => {
    const [user] = await executor
        .select(adminUserListColumns)
        .from(usersTable)
        .where(and(eq(usersTable.id, id), ...visibleUserConditions))
        .limit(1);

    return user ?? null;
};

const findUserDetailById = async (
    executor: Executor,
    id: string
): Promise<AdminUserDetail | null> => {
    const [user] = await executor
        .select(adminUserDetailColumns)
        .from(usersTable)
        .where(and(eq(usersTable.id, id), ...visibleUserConditions))
        .limit(1);

    return user ?? null;
};

const findStatusHistoryByUserId = async (
    executor: Executor,
    userId: string,
    limit: number
): Promise<AdminUserStatusHistoryItem[]> => {
    // Alias users for the LEFT JOIN so the actor's name comes back even though
    // the same table is implicitly the subject in user_status_history.
    const actor = aliasedTable(usersTable, "actor");

    const rows = await executor
        .select({
            id: userStatusHistoryTable.id,
            oldStatus: userStatusHistoryTable.oldStatus,
            newStatus: userStatusHistoryTable.newStatus,
            reason: userStatusHistoryTable.reason,
            createdAt: userStatusHistoryTable.createdAt,
            actorId: actor.id,
            actorFirstName: actor.firstName,
            actorLastName: actor.lastName,
        })
        .from(userStatusHistoryTable)
        .leftJoin(actor, eq(userStatusHistoryTable.changedByUserId, actor.id))
        .where(eq(userStatusHistoryTable.userId, userId))
        .orderBy(desc(userStatusHistoryTable.createdAt))
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

const updateUserStatus = async (
    executor: Executor,
    id: string,
    status: UserStatus,
    reason?: string
): Promise<AdminUserListItem | null> => {
    const isBanned = status === "BANNED";
    const [updated] = await executor
        .update(usersTable)
        .set({
            userStatus: status,
            banned: isBanned,
            banReason: isBanned ? (reason ?? null) : null,
            banExpires: null,
        })
        .where(and(eq(usersTable.id, id), ...visibleUserConditions))
        .returning(adminUserListColumns);

    return updated ?? null;
};

const deleteSessionsByUserId = async (
    executor: Executor,
    userId: string
): Promise<void> => {
    await executor
        .delete(sessionsTable)
        .where(eq(sessionsTable.userId, userId));
};

const insertUserStatusHistory = async (
    executor: Executor,
    values: {
        userId: string;
        oldStatus: UserStatus;
        newStatus: UserStatus;
        changedByUserId: string;
        reason?: string;
    }
): Promise<void> => {
    await executor.insert(userStatusHistoryTable).values({
        userId: values.userId,
        oldStatus: values.oldStatus,
        newStatus: values.newStatus,
        changedByUserId: values.changedByUserId,
        reason: values.reason ?? null,
    });
};

// Admin tooling deliberately excludes rides driven by other admin accounts —
// mirrors `visibleUserConditions` for users. The seeded admin doesn't drive
// today, but if that ever changes (or another admin gets promoted), their
// rides should still be invisible/unmoderatable from this surface.
const visibleRideJoinConditions = [
    isNull(ridesTable.deletedAt),
    isNull(usersTable.deletedAt),
    ne(usersTable.userRole, "ADMIN"),
];

const findRideList = async (
    executor: Executor,
    params: {
        limit: number;
        status?: RideStatus;
        search?: string;
        cursorPosition?: { id: string; createdAt: Date };
    }
): Promise<AdminRideListItem[]> => {
    const conditions = [...visibleRideJoinConditions];

    if (params.status) {
        conditions.push(eq(ridesTable.rideStatus, params.status));
    }

    if (params.search) {
        const pattern = `%${params.search}%`;
        const searchClause = or(
            ilike(usersTable.email, pattern),
            ilike(usersTable.firstName, pattern),
            ilike(usersTable.lastName, pattern)
        );
        if (searchClause) conditions.push(searchClause);
    }

    if (params.cursorPosition) {
        const cursorClause = or(
            lt(ridesTable.createdAt, params.cursorPosition.createdAt),
            and(
                eq(ridesTable.createdAt, params.cursorPosition.createdAt),
                lt(ridesTable.id, params.cursorPosition.id)
            )
        );
        if (cursorClause) conditions.push(cursorClause);
    }

    const originStops = aliasedTable(rideStopsTable, "admin_origin_stops");
    const destStops = aliasedTable(rideStopsTable, "admin_dest_stops");

    // Subquery to find the last stop_order per ride so the destination join
    // can match without scanning every stop in the row group.
    const lastStopOrders = executor
        .select({
            rideId: rideStopsTable.rideId,
            stopOrder: sql<number>`MAX(${rideStopsTable.stopOrder})`.as(
                "stopOrder"
            ),
        })
        .from(rideStopsTable)
        .groupBy(rideStopsTable.rideId)
        .as("admin_ride_last_stops");

    // COALESCE-summed seat count of bookings that still hold a seat (PENDING
    // or CONFIRMED). Same predicate the driver-facing flows use to decide
    // whether a cancellation has anyone to notify.
    const seatsByRide = executor
        .select({
            rideId: bookingsTable.rideId,
            seats: sql<number>`COALESCE(SUM(${bookingsTable.seatCount}), 0)::int`.as(
                "seats"
            ),
        })
        .from(bookingsTable)
        .where(
            and(
                inArray(bookingsTable.bookingStatus, ["PENDING", "CONFIRMED"]),
                isNull(bookingsTable.deletedAt)
            )
        )
        .groupBy(bookingsTable.rideId)
        .as("admin_ride_active_seats");

    const rows = await executor
        .select({
            id: ridesTable.id,
            rideStatus: ridesTable.rideStatus,
            departureAt: ridesTable.departureAt,
            offeredSeats: ridesTable.offeredSeats,
            currency: ridesTable.currency,
            createdAt: ridesTable.createdAt,
            originCity: originStops.city,
            destinationCity: destStops.city,
            activeSeatCount: sql<number>`COALESCE(${seatsByRide.seats}, 0)::int`,
            driverId: usersTable.id,
            driverEmail: usersTable.email,
            driverFirstName: usersTable.firstName,
            driverLastName: usersTable.lastName,
            driverProfilePhotoUrl: usersTable.profilePhotoUrl,
        })
        .from(ridesTable)
        .innerJoin(usersTable, eq(ridesTable.driverId, usersTable.id))
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
        .leftJoin(seatsByRide, eq(seatsByRide.rideId, ridesTable.id))
        .where(and(...conditions))
        .orderBy(desc(ridesTable.createdAt), desc(ridesTable.id))
        .limit(params.limit);

    return rows.map((row) => ({
        id: row.id,
        rideStatus: row.rideStatus,
        departureAt: row.departureAt,
        offeredSeats: row.offeredSeats,
        currency: row.currency,
        originCity: row.originCity,
        destinationCity: row.destinationCity,
        activeSeatCount: row.activeSeatCount,
        driver: {
            id: row.driverId,
            email: row.driverEmail,
            firstName: row.driverFirstName,
            lastName: row.driverLastName,
            profilePhotoUrl: row.driverProfilePhotoUrl,
        },
        createdAt: row.createdAt,
    }));
};

// Cursor anchor lookup — no visibility filter (cursor was issued from a
// previously visible row; service decides what to do if it no longer
// resolves). Same shape as `findUserCreatedAt`.
const findRideCreatedAt = async (
    executor: Executor,
    id: string
): Promise<Date | null> => {
    const [row] = await executor
        .select({ createdAt: ridesTable.createdAt })
        .from(ridesTable)
        .where(eq(ridesTable.id, id))
        .limit(1);

    return row?.createdAt ?? null;
};

const findRideDetailById = async (
    executor: Executor,
    id: string
): Promise<AdminRideDetail | null> => {
    const [row] = await executor
        .select({
            id: ridesTable.id,
            rideStatus: ridesTable.rideStatus,
            departureAt: ridesTable.departureAt,
            arrivalEstimateAt: ridesTable.arrivalEstimateAt,
            autoEndAt: ridesTable.autoEndAt,
            endedAt: ridesTable.endedAt,
            endedByUserId: ridesTable.endedByUserId,
            endSource: ridesTable.endSource,
            endReason: ridesTable.endReason,
            autoEndProcessedAt: ridesTable.autoEndProcessedAt,
            offeredSeats: ridesTable.offeredSeats,
            currency: ridesTable.currency,
            description: ridesTable.description,
            createdAt: ridesTable.createdAt,
            updatedAt: ridesTable.updatedAt,
            driverId: usersTable.id,
            driverEmail: usersTable.email,
            driverFirstName: usersTable.firstName,
            driverLastName: usersTable.lastName,
            driverProfilePhotoUrl: usersTable.profilePhotoUrl,
            driverUserStatus: usersTable.userStatus,
            carId: carsTable.id,
            carSpz: carsTable.spz,
            carBrand: carModelsTable.brand,
            carModelName: carModelsTable.modelName,
        })
        .from(ridesTable)
        .innerJoin(usersTable, eq(ridesTable.driverId, usersTable.id))
        .innerJoin(carsTable, eq(ridesTable.carId, carsTable.id))
        .leftJoin(carModelsTable, eq(carsTable.modelId, carModelsTable.id))
        .where(and(eq(ridesTable.id, id), ...visibleRideJoinConditions))
        .limit(1);

    if (!row) return null;

    const [stops, prices, rideBookings] = await Promise.all([
        executor
            .select({
                id: rideStopsTable.id,
                stopOrder: rideStopsTable.stopOrder,
                address: rideStopsTable.address,
                city: rideStopsTable.city,
                countryCode: rideStopsTable.countryCode,
                plannedArrivalAt: rideStopsTable.plannedArrivalAt,
                plannedDepartureAt: rideStopsTable.plannedDepartureAt,
            })
            .from(rideStopsTable)
            .where(eq(rideStopsTable.rideId, id))
            .orderBy(asc(rideStopsTable.stopOrder)),
        executor
            .select({
                startStopId: pricesTable.startStopId,
                endStopId: pricesTable.endStopId,
                amount: pricesTable.amount,
                currency: pricesTable.currency,
            })
            .from(pricesTable)
            .where(eq(pricesTable.rideId, id)),
        executor
            .select({
                id: bookingsTable.id,
                bookingStatus: bookingsTable.bookingStatus,
                seatCount: bookingsTable.seatCount,
                passengerId: usersTable.id,
                passengerFirstName: usersTable.firstName,
                passengerLastName: usersTable.lastName,
                passengerProfilePhotoUrl: usersTable.profilePhotoUrl,
            })
            .from(bookingsTable)
            .innerJoin(usersTable, eq(bookingsTable.passengerId, usersTable.id))
            .where(
                and(
                    eq(bookingsTable.rideId, id),
                    isNull(bookingsTable.deletedAt)
                )
            ),
    ]);

    return {
        id: row.id,
        rideStatus: row.rideStatus,
        departureAt: row.departureAt,
        arrivalEstimateAt: row.arrivalEstimateAt,
        autoEndAt: row.autoEndAt,
        endedAt: row.endedAt,
        endedByUserId: row.endedByUserId,
        endSource: row.endSource,
        endReason: row.endReason,
        autoEndProcessedAt: row.autoEndProcessedAt,
        offeredSeats: row.offeredSeats,
        currency: row.currency,
        description: row.description,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        driver: {
            id: row.driverId,
            email: row.driverEmail,
            firstName: row.driverFirstName,
            lastName: row.driverLastName,
            profilePhotoUrl: row.driverProfilePhotoUrl,
            userStatus: row.driverUserStatus,
        },
        car: {
            id: row.carId,
            spz: row.carSpz,
            brand: row.carBrand,
            modelName: row.carModelName,
        },
        stops,
        prices,
        bookings: rideBookings.map((b) => ({
            id: b.id,
            bookingStatus: b.bookingStatus,
            seatCount: b.seatCount,
            passenger: {
                id: b.passengerId,
                firstName: b.passengerFirstName,
                lastName: b.passengerLastName,
                profilePhotoUrl: b.passengerProfilePhotoUrl,
            },
        })),
    };
};

const findRideStatusHistoryByRideId = async (
    executor: Executor,
    rideId: string,
    limit: number
): Promise<AdminRideStatusHistoryItem[]> => {
    const actor = aliasedTable(usersTable, "ride_history_actor");

    const rows = await executor
        .select({
            id: rideStatusHistoryTable.id,
            oldStatus: rideStatusHistoryTable.oldStatus,
            newStatus: rideStatusHistoryTable.newStatus,
            reason: rideStatusHistoryTable.reason,
            createdAt: rideStatusHistoryTable.createdAt,
            actorId: actor.id,
            actorFirstName: actor.firstName,
            actorLastName: actor.lastName,
        })
        .from(rideStatusHistoryTable)
        .leftJoin(actor, eq(rideStatusHistoryTable.changedByUserId, actor.id))
        .where(eq(rideStatusHistoryTable.rideId, rideId))
        .orderBy(desc(rideStatusHistoryTable.createdAt))
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

// Light visibility check used by the cancel flow — same admin filter as the
// list/detail queries, returning just the bits the service needs to decide
// whether a transition is necessary.
const findRideForAdminCancel = async (
    executor: Executor,
    id: string
): Promise<{ rideStatus: RideStatus } | null> => {
    const [row] = await executor
        .select({ rideStatus: ridesTable.rideStatus })
        .from(ridesTable)
        .innerJoin(usersTable, eq(ridesTable.driverId, usersTable.id))
        .where(and(eq(ridesTable.id, id), ...visibleRideJoinConditions))
        .limit(1);

    return row ?? null;
};

const updateRideStatusToCancelledById = async (
    executor: Executor,
    id: string
): Promise<{ id: string } | null> => {
    const [updated] = await executor
        .update(ridesTable)
        .set({ rideStatus: "CANCELLED" })
        .where(and(eq(ridesTable.id, id), isNull(ridesTable.deletedAt)))
        .returning({ id: ridesTable.id });

    return updated ?? null;
};

const insertRideStatusHistoryRow = async (
    executor: Executor,
    values: {
        rideId: string;
        oldStatus: RideStatus | null;
        newStatus: RideStatus;
        changedByUserId: string;
        reason: string;
    }
): Promise<void> => {
    await executor.insert(rideStatusHistoryTable).values(values);
};

// Same admin-only filter applied to ride moderation: hide reviews authored
// by another admin (mirrors `visibleUserConditions` / `visibleRideJoinConditions`).
// Reviews referencing an admin as `subject` stay visible — moderators may need
// to see evidence flagged against an admin even though we won't moderate the
// admin account from this surface.
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
        // Subject is driver → author is NOT the ride's driver
        conditions.push(ne(reviewsTable.authorId, ridesTable.driverId));
    } else if (params.subjectRole === "PASSENGER") {
        // Subject is passenger → author IS the ride's driver
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

const findReportList = async (
    executor: Executor,
    params: {
        limit: number;
        status?: ReportStatus;
        reportType?: ReportType;
        search?: string;
        cursorPosition?: { id: string; createdAt: Date };
    }
): Promise<AdminReportListItem[]> => {
    const reporter = aliasedTable(usersTable, "admin_report_reporter");
    const target = aliasedTable(usersTable, "admin_report_target");

    const conditions = [isNull(reportsTable.deletedAt)];

    if (params.status) {
        conditions.push(eq(reportsTable.reportStatus, params.status));
    }
    if (params.reportType) {
        conditions.push(eq(reportsTable.reportType, params.reportType));
    }
    if (params.search) {
        const pattern = `%${params.search}%`;
        const searchClause = or(
            ilike(reportsTable.description, pattern),
            ilike(reporter.email, pattern),
            ilike(reporter.firstName, pattern),
            ilike(reporter.lastName, pattern),
            ilike(target.email, pattern),
            ilike(target.firstName, pattern),
            ilike(target.lastName, pattern)
        );
        if (searchClause) conditions.push(searchClause);
    }
    if (params.cursorPosition) {
        const cursorClause = or(
            lt(reportsTable.createdAt, params.cursorPosition.createdAt),
            and(
                eq(reportsTable.createdAt, params.cursorPosition.createdAt),
                lt(reportsTable.id, params.cursorPosition.id)
            )
        );
        if (cursorClause) conditions.push(cursorClause);
    }

    const rows = await executor
        .select({
            id: reportsTable.id,
            reportType: reportsTable.reportType,
            reportStatus: reportsTable.reportStatus,
            description: reportsTable.description,
            rideId: reportsTable.rideId,
            createdAt: reportsTable.createdAt,
            reporterId: reporter.id,
            reporterEmail: reporter.email,
            reporterFirstName: reporter.firstName,
            reporterLastName: reporter.lastName,
            reporterProfilePhotoUrl: reporter.profilePhotoUrl,
            targetId: target.id,
            targetEmail: target.email,
            targetFirstName: target.firstName,
            targetLastName: target.lastName,
            targetProfilePhotoUrl: target.profilePhotoUrl,
        })
        .from(reportsTable)
        .innerJoin(reporter, eq(reportsTable.reporterId, reporter.id))
        .innerJoin(target, eq(reportsTable.targetUserId, target.id))
        .where(and(...conditions))
        .orderBy(desc(reportsTable.createdAt), desc(reportsTable.id))
        .limit(params.limit);

    return rows.map((row) => ({
        id: row.id,
        reportType: row.reportType,
        reportStatus: row.reportStatus,
        description: row.description,
        rideId: row.rideId,
        reporter: {
            id: row.reporterId,
            email: row.reporterEmail,
            firstName: row.reporterFirstName,
            lastName: row.reporterLastName,
            profilePhotoUrl: row.reporterProfilePhotoUrl,
        },
        target: {
            id: row.targetId,
            email: row.targetEmail,
            firstName: row.targetFirstName,
            lastName: row.targetLastName,
            profilePhotoUrl: row.targetProfilePhotoUrl,
        },
        createdAt: row.createdAt,
    }));
};

const findReportCreatedAt = async (
    executor: Executor,
    id: string
): Promise<Date | null> => {
    const [row] = await executor
        .select({ createdAt: reportsTable.createdAt })
        .from(reportsTable)
        .where(and(eq(reportsTable.id, id), isNull(reportsTable.deletedAt)))
        .limit(1);
    return row?.createdAt ?? null;
};

const findReportDetailById = async (
    executor: Executor,
    id: string
): Promise<AdminReportDetail | null> => {
    const reporter = aliasedTable(usersTable, "admin_report_detail_reporter");
    const target = aliasedTable(usersTable, "admin_report_detail_target");
    const originStops = aliasedTable(
        rideStopsTable,
        "admin_report_detail_origin"
    );
    const destStops = aliasedTable(rideStopsTable, "admin_report_detail_dest");

    const lastStopOrders = executor
        .select({
            rideId: rideStopsTable.rideId,
            stopOrder: sql<number>`MAX(${rideStopsTable.stopOrder})`.as(
                "stopOrder"
            ),
        })
        .from(rideStopsTable)
        .groupBy(rideStopsTable.rideId)
        .as("admin_report_detail_last_stops");

    const [row] = await executor
        .select({
            id: reportsTable.id,
            reportType: reportsTable.reportType,
            reportStatus: reportsTable.reportStatus,
            description: reportsTable.description,
            resolutionReason: reportsTable.resolutionReason,
            rideId: reportsTable.rideId,
            createdAt: reportsTable.createdAt,
            updatedAt: reportsTable.updatedAt,
            reporterId: reporter.id,
            reporterEmail: reporter.email,
            reporterFirstName: reporter.firstName,
            reporterLastName: reporter.lastName,
            reporterProfilePhotoUrl: reporter.profilePhotoUrl,
            targetId: target.id,
            targetEmail: target.email,
            targetFirstName: target.firstName,
            targetLastName: target.lastName,
            targetProfilePhotoUrl: target.profilePhotoUrl,
            rideDepartureAt: ridesTable.departureAt,
            originCity: originStops.city,
            destinationCity: destStops.city,
        })
        .from(reportsTable)
        .innerJoin(reporter, eq(reportsTable.reporterId, reporter.id))
        .innerJoin(target, eq(reportsTable.targetUserId, target.id))
        .leftJoin(ridesTable, eq(reportsTable.rideId, ridesTable.id))
        .leftJoin(
            originStops,
            and(
                eq(originStops.rideId, ridesTable.id),
                eq(originStops.stopOrder, 0)
            )
        )

        .leftJoin(lastStopOrders, eq(lastStopOrders.rideId, ridesTable.id))
        .leftJoin(
            destStops,
            and(
                eq(destStops.rideId, ridesTable.id),
                eq(destStops.stopOrder, lastStopOrders.stopOrder)
            )
        )

        .where(and(eq(reportsTable.id, id), isNull(reportsTable.deletedAt)))
        .limit(1);

    if (!row) return null;

    return {
        id: row.id,
        reportType: row.reportType,
        reportStatus: row.reportStatus,
        description: row.description,
        resolutionReason: row.resolutionReason,
        rideId: row.rideId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        reporter: {
            id: row.reporterId,
            email: row.reporterEmail,
            firstName: row.reporterFirstName,
            lastName: row.reporterLastName,
            profilePhotoUrl: row.reporterProfilePhotoUrl,
        },
        target: {
            id: row.targetId,
            email: row.targetEmail,
            firstName: row.targetFirstName,
            lastName: row.targetLastName,
            profilePhotoUrl: row.targetProfilePhotoUrl,
        },
        ride:
            row.rideId &&
            row.rideDepartureAt &&
            row.originCity &&
            row.destinationCity
                ? {
                      id: row.rideId,
                      departureAt: row.rideDepartureAt,
                      originCity: row.originCity,
                      destinationCity: row.destinationCity,
                  }
                : null,
    };
};

const findReportStatusHistoryByReportId = async (
    executor: Executor,
    reportId: string,
    limit: number
): Promise<AdminReportStatusHistoryItem[]> => {
    const actor = aliasedTable(usersTable, "report_history_actor");

    const rows = await executor
        .select({
            id: reportStatusHistoryTable.id,
            oldStatus: reportStatusHistoryTable.oldStatus,
            newStatus: reportStatusHistoryTable.newStatus,
            reason: reportStatusHistoryTable.reason,
            createdAt: reportStatusHistoryTable.createdAt,
            actorId: actor.id,
            actorFirstName: actor.firstName,
            actorLastName: actor.lastName,
        })
        .from(reportStatusHistoryTable)
        .leftJoin(actor, eq(reportStatusHistoryTable.changedByUserId, actor.id))
        .where(eq(reportStatusHistoryTable.reportId, reportId))
        .orderBy(desc(reportStatusHistoryTable.createdAt))
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

const findReportForAdminUpdate = async (
    executor: Executor,
    id: string
): Promise<{ reportStatus: ReportStatus } | null> => {
    const [row] = await executor
        .select({ reportStatus: reportsTable.reportStatus })
        .from(reportsTable)
        .where(and(eq(reportsTable.id, id), isNull(reportsTable.deletedAt)))
        .limit(1);
    return row ?? null;
};

const updateReportStatusById = async (
    executor: Executor,
    id: string,
    status: ReportStatus,
    resolutionReason: string | null
): Promise<{ id: string } | null> => {
    const [updated] = await executor
        .update(reportsTable)
        .set({ reportStatus: status, resolutionReason })
        .where(and(eq(reportsTable.id, id), isNull(reportsTable.deletedAt)))
        .returning({ id: reportsTable.id });
    return updated ?? null;
};

const insertReportStatusHistoryRow = async (
    executor: Executor,
    values: {
        reportId: string;
        oldStatus: ReportStatus | null;
        newStatus: ReportStatus;
        changedByUserId: string;
        reason: string | null;
    }
): Promise<void> => {
    await executor.insert(reportStatusHistoryTable).values(values);
};

const getDashboardMetrics = async (
    executor: Executor
): Promise<AdminDashboardResponse> => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const originStops = aliasedTable(rideStopsTable, "dash_origin_stops");
    const destStops = aliasedTable(rideStopsTable, "dash_dest_stops");

    const lastStopOrders = executor
        .select({
            rideId: rideStopsTable.rideId,
            stopOrder: sql<number>`MAX(${rideStopsTable.stopOrder})`.as(
                "stopOrder"
            ),
        })
        .from(rideStopsTable)
        .groupBy(rideStopsTable.rideId)
        .as("dash_last_stops");

    const [weeklyRides, weeklyRevenue, popularRoutes, userCounts, driverCount] =
        await Promise.all([
            executor
                .select({
                    date: sql<string>`to_char(${ridesTable.createdAt}, 'YYYY-MM-DD')`,
                    count: sql<number>`COUNT(*)::int`,
                })
                .from(ridesTable)
                .where(
                    and(
                        gte(ridesTable.createdAt, sevenDaysAgo),
                        isNull(ridesTable.deletedAt)
                    )
                )
                .groupBy(sql`to_char(${ridesTable.createdAt}, 'YYYY-MM-DD')`)
                .orderBy(sql`to_char(${ridesTable.createdAt}, 'YYYY-MM-DD')`),

            executor
                .select({
                    date: sql<string>`to_char(${bookingsTable.createdAt}, 'YYYY-MM-DD')`,
                    totalCents: sql<number>`COALESCE(SUM(${bookingsTable.priceAmount} * ${bookingsTable.seatCount}), 0)::int`,
                })
                .from(bookingsTable)
                .where(
                    and(
                        gte(bookingsTable.createdAt, sevenDaysAgo),
                        inArray(bookingsTable.bookingStatus, [
                            "CONFIRMED",
                            "COMPLETED",
                        ]),
                        isNull(bookingsTable.deletedAt)
                    )
                )
                .groupBy(sql`to_char(${bookingsTable.createdAt}, 'YYYY-MM-DD')`)
                .orderBy(
                    sql`to_char(${bookingsTable.createdAt}, 'YYYY-MM-DD')`
                ),

            executor
                .select({
                    originCity: originStops.city,
                    destinationCity: destStops.city,
                    count: sql<number>`COUNT(${ridesTable.id})::int`,
                })
                .from(ridesTable)
                .innerJoin(
                    originStops,
                    and(
                        eq(originStops.rideId, ridesTable.id),
                        eq(originStops.stopOrder, 0)
                    )
                )

                .innerJoin(
                    lastStopOrders,
                    eq(lastStopOrders.rideId, ridesTable.id)
                )
                .innerJoin(
                    destStops,
                    and(
                        eq(destStops.rideId, ridesTable.id),
                        eq(destStops.stopOrder, lastStopOrders.stopOrder)
                    )
                )

                .where(isNull(ridesTable.deletedAt))
                .groupBy(originStops.city, destStops.city)
                .orderBy(desc(sql`COUNT(${ridesTable.id})`))
                .limit(5),

            executor
                .select({
                    totalRegistered: sql<number>`COUNT(CASE WHEN ${usersTable.userRole} = 'USER' AND ${usersTable.deletedAt} IS NULL THEN 1 END)::int`,
                    activeInLast24h: sql<number>`COUNT(CASE WHEN ${usersTable.userRole} = 'USER' AND ${usersTable.deletedAt} IS NULL AND ${usersTable.lastActiveAt} >= NOW() - INTERVAL '24 hours' THEN 1 END)::int`,
                    pendingVerification: sql<number>`COUNT(CASE WHEN ${usersTable.userRole} = 'USER' AND ${usersTable.deletedAt} IS NULL AND ${usersTable.userStatus} = 'PENDING' THEN 1 END)::int`,
                    bannedAccounts: sql<number>`COUNT(CASE WHEN ${usersTable.userRole} = 'USER' AND ${usersTable.deletedAt} IS NULL AND ${usersTable.userStatus} = 'BANNED' THEN 1 END)::int`,
                })
                .from(usersTable),

            executor
                .select({
                    count: sql<number>`COUNT(DISTINCT ${carsTable.ownerId})::int`,
                })
                .from(carsTable)
                .where(isNull(carsTable.deletedAt)),
        ]);

    const metrics = userCounts[0] ?? {
        totalRegistered: 0,
        activeInLast24h: 0,
        pendingVerification: 0,
        bannedAccounts: 0,
    };
    const drivers = driverCount[0]?.count ?? 0;

    return {
        weeklyRides,
        weeklyRevenue,
        popularRoutes,
        userMetrics: {
            ...metrics,
            drivers,
            passengers: Math.max(0, metrics.totalRegistered - drivers),
        },
    };
};

export const AdminRepository = {
    findUserList,
    findUserCreatedAt,
    findUserById,
    findUserDetailById,
    findStatusHistoryByUserId,
    updateUserStatus,
    deleteSessionsByUserId,
    insertUserStatusHistory,
    findRideList,
    findRideCreatedAt,
    findRideDetailById,
    findRideStatusHistoryByRideId,
    findRideForAdminCancel,
    updateRideStatusToCancelledById,
    insertRideStatusHistoryRow,
    findReviewList,
    findReviewCounts,
    findReviewCreatedAt,
    findReviewDetailById,
    findReviewStatusHistoryByReviewId,
    findReviewForAdminUpdate,
    updateReviewStatusById,
    insertReviewStatusHistoryRow,
    deleteReviewById,
    findReportList,
    findReportCreatedAt,
    findReportDetailById,
    findReportStatusHistoryByReportId,
    findReportForAdminUpdate,
    updateReportStatusById,
    insertReportStatusHistoryRow,
    getDashboardMetrics,
};
