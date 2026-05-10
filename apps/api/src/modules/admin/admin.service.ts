import type {
    AdminReviewDetailResponse,
    AdminReviewListItem,
    AdminReviewListResponse,
    AdminRideDetailResponse,
    AdminRideListResponse,
    AdminUserDetailResponse,
    AdminUserListItem,
    AdminUserListResponse,
} from "@repo/shared";
import { db } from "../../db";
import { AdminError, AdminErrorCodes } from "./admin.errors";
import { AdminRepository } from "./admin.repository";
import { RideRepository } from "../rides/ride.repository";
import type {
    AdminCancelRideInput,
    AdminReviewListFilters,
    AdminRideListFilters,
    AdminUserListFilters,
    SetReviewStatusInput,
    SetUserStatusInput,
} from "./admin.types";

const STATUS_HISTORY_DEFAULT_LIMIT = 50;

const getUserList = async (
    filters: AdminUserListFilters
): Promise<AdminUserListResponse> => {
    let cursorPosition: { id: string; createdAt: Date } | undefined;

    if (filters.cursor) {
        const createdAt = await AdminRepository.findUserCreatedAt(
            db,
            filters.cursor
        );
        // Bogus or invalidated cursor — return an empty page rather than
        // silently restarting from the first row, which would confuse clients.
        if (!createdAt) return { items: [], nextCursor: null };
        cursorPosition = { id: filters.cursor, createdAt };
    }

    // Fetch one extra row to detect whether a next page exists without a
    // separate COUNT(*).
    const rows = await AdminRepository.findUserList(db, {
        limit: filters.limit + 1,
        search: filters.search,
        cursorPosition,
    });

    const hasMore = rows.length > filters.limit;
    const items = hasMore ? rows.slice(0, filters.limit) : rows;
    const nextCursor = hasMore ? (items[items.length - 1]?.id ?? null) : null;

    return { items, nextCursor };
};

const getUserDetail = async (
    targetUserId: string
): Promise<AdminUserDetailResponse> => {
    // Read-only fan-out: detail and history are independent SELECTs and can
    // run in parallel without any need for a transaction.
    const [user, statusHistory] = await Promise.all([
        AdminRepository.findUserDetailById(db, targetUserId),
        AdminRepository.findStatusHistoryByUserId(
            db,
            targetUserId,
            STATUS_HISTORY_DEFAULT_LIMIT
        ),
    ]);

    if (!user) {
        throw new AdminError(AdminErrorCodes.UserNotFound);
    }

    return { user, statusHistory };
};

const setUserStatus = async ({
    actorId,
    targetUserId,
    newStatus,
    reason,
}: SetUserStatusInput): Promise<AdminUserListItem> => {
    return await db.transaction(async (tx) => {
        const target = await AdminRepository.findUserById(tx, targetUserId);

        // Defense in depth: repository already excludes the seeded admin from
        // its result set, but the explicit check protects against a future
        // refactor that loosens the filter and silently exposes the admin
        // account to status changes from here.
        if (!target || target.userRole === "ADMIN") {
            throw new AdminError(AdminErrorCodes.UserNotFound);
        }

        // Idempotent: skip both the UPDATE and the audit row so updatedAt and
        // user_status_history only reflect real transitions.
        if (target.userStatus === newStatus) {
            return target;
        }

        const updated = await AdminRepository.updateUserStatus(
            tx,
            targetUserId,
            newStatus
        );

        if (!updated) {
            // Race: target was soft-deleted between the existence check and
            // the update. Roll back to leave history consistent with users.
            throw new AdminError(AdminErrorCodes.UserNotFound);
        }

        await AdminRepository.insertUserStatusHistory(tx, {
            userId: targetUserId,
            oldStatus: target.userStatus,
            newStatus,
            changedByUserId: actorId,
            reason,
        });

        return updated;
    });
};

const getRideList = async (
    filters: AdminRideListFilters
): Promise<AdminRideListResponse> => {
    let cursorPosition: { id: string; createdAt: Date } | undefined;

    if (filters.cursor) {
        const createdAt = await AdminRepository.findRideCreatedAt(
            db,
            filters.cursor
        );
        // Same handling as getUserList: invalid/expired cursor returns empty
        // page rather than silently restarting from row zero.
        if (!createdAt) return { items: [], nextCursor: null };
        cursorPosition = { id: filters.cursor, createdAt };
    }

    const rows = await AdminRepository.findRideList(db, {
        limit: filters.limit + 1,
        status: filters.status,
        search: filters.search,
        cursorPosition,
    });

    const hasMore = rows.length > filters.limit;
    const items = hasMore ? rows.slice(0, filters.limit) : rows;
    const nextCursor = hasMore ? (items[items.length - 1]?.id ?? null) : null;

    return { items, nextCursor };
};

const getRideDetail = async (
    rideId: string
): Promise<AdminRideDetailResponse> => {
    const [ride, statusHistory] = await Promise.all([
        AdminRepository.findRideDetailById(db, rideId),
        AdminRepository.findRideStatusHistoryByRideId(
            db,
            rideId,
            STATUS_HISTORY_DEFAULT_LIMIT
        ),
    ]);

    if (!ride) {
        throw new AdminError(AdminErrorCodes.RideNotFound);
    }

    return { ride, statusHistory };
};

const cancelRide = async ({
    actorId,
    rideId,
    reason,
}: AdminCancelRideInput): Promise<{ id: string; status: "CANCELLED" }> => {
    return await db.transaction(async (tx) => {
        const ride = await AdminRepository.findRideForAdminCancel(tx, rideId);

        if (!ride) {
            throw new AdminError(AdminErrorCodes.RideNotFound);
        }

        if (ride.rideStatus === "CANCELLED") {
            throw new AdminError(AdminErrorCodes.RideAlreadyCancelled);
        }

        const updated = await AdminRepository.updateRideStatusToCancelledById(
            tx,
            rideId
        );

        if (!updated) {
            // Race: ride was soft-deleted between the visibility check and
            // the update. Roll back so history stays consistent with rides.
            throw new AdminError(AdminErrorCodes.RideNotFound);
        }

        await AdminRepository.insertRideStatusHistoryRow(tx, {
            rideId: updated.id,
            oldStatus: ride.rideStatus,
            newStatus: "CANCELLED",
            changedByUserId: actorId,
            reason,
        });

        // Cascade to active passenger bookings — same shape as the driver
        // cancel flow (`RideService.cancelRide`). Reusing the ride repo's
        // bulk helpers keeps the DML in one place.
        const activeBookings = await RideRepository.findActiveBookingsByRideId(
            tx,
            rideId
        );

        if (activeBookings.length > 0) {
            const cascadeReason = `Ride cancelled by admin: ${reason}`;
            const ids = activeBookings.map((b) => b.id);

            await RideRepository.bulkCancelBookings(
                tx,
                ids,
                actorId,
                cascadeReason
            );

            await RideRepository.bulkInsertBookingStatusHistory(
                tx,
                activeBookings.map((b) => ({
                    bookingId: b.id,
                    oldStatus: b.bookingStatus,
                    newStatus: "CANCELLED" as const,
                    changedByUserId: actorId,
                    reason: cascadeReason,
                }))
            );
        }

        return { id: updated.id, status: "CANCELLED" as const };
    });
};

const getReviewList = async (
    filters: AdminReviewListFilters
): Promise<AdminReviewListResponse> => {
    let cursorPosition: { id: string; createdAt: Date } | undefined;

    if (filters.cursor) {
        const createdAt = await AdminRepository.findReviewCreatedAt(
            db,
            filters.cursor
        );
        if (!createdAt) return { items: [], nextCursor: null };
        cursorPosition = { id: filters.cursor, createdAt };
    }

    const rows = await AdminRepository.findReviewList(db, {
        limit: filters.limit + 1,
        status: filters.status,
        minRating: filters.minRating,
        maxRating: filters.maxRating,
        search: filters.search,
        cursorPosition,
    });

    const hasMore = rows.length > filters.limit;
    const items = hasMore ? rows.slice(0, filters.limit) : rows;
    const nextCursor = hasMore ? (items[items.length - 1]?.id ?? null) : null;

    return { items, nextCursor };
};

const getReviewDetail = async (
    reviewId: string
): Promise<AdminReviewDetailResponse> => {
    const [review, statusHistory] = await Promise.all([
        AdminRepository.findReviewDetailById(db, reviewId),
        AdminRepository.findReviewStatusHistoryByReviewId(
            db,
            reviewId,
            STATUS_HISTORY_DEFAULT_LIMIT
        ),
    ]);

    if (!review) {
        throw new AdminError(AdminErrorCodes.ReviewNotFound);
    }

    return { review, statusHistory };
};

const setReviewStatus = async ({
    actorId,
    reviewId,
    newStatus,
    reason,
}: SetReviewStatusInput): Promise<AdminReviewListItem> => {
    return await db.transaction(async (tx) => {
        const review = await AdminRepository.findReviewForAdminUpdate(
            tx,
            reviewId
        );

        if (!review) {
            throw new AdminError(AdminErrorCodes.ReviewNotFound);
        }

        // Idempotent no-op — same shape as setUserStatus. The list item we
        // return is rebuilt from the DB below, so callers always get a
        // consistent payload regardless of whether a transition happened.
        if (review.reviewStatus !== newStatus) {
            const updated = await AdminRepository.updateReviewStatusById(
                tx,
                reviewId,
                newStatus
            );

            if (!updated) {
                // Race: review disappeared between visibility check and
                // update. Roll back so history stays consistent with reviews.
                throw new AdminError(AdminErrorCodes.ReviewNotFound);
            }

            await AdminRepository.insertReviewStatusHistoryRow(tx, {
                reviewId: updated.id,
                oldStatus: review.reviewStatus,
                newStatus,
                changedByUserId: actorId,
                reason,
            });
        }

        // Re-fetch the post-update row so the response carries the new
        // status (and any other fresh fields) without inferring it locally.
        // Detail query already enforces the admin-visibility filter.
        const detail = await AdminRepository.findReviewDetailById(tx, reviewId);
        if (!detail) {
            throw new AdminError(AdminErrorCodes.ReviewNotFound);
        }
        return {
            id: detail.id,
            rideId: detail.rideId,
            rating: detail.rating,
            comment: detail.comment,
            reviewStatus: detail.reviewStatus,
            author: detail.author,
            subject: detail.subject,
            createdAt: detail.createdAt,
        };
    });
};

export const AdminService = {
    getUserList,
    getUserDetail,
    setUserStatus,
    getRideList,
    getRideDetail,
    cancelRide,
    getReviewList,
    getReviewDetail,
    setReviewStatus,
};
