import type {
    AdminUserDetailResponse,
    AdminUserListItem,
    AdminUserListResponse,
} from "@repo/shared";
import { db } from "../../../db";
import { UserError, UserErrorCodes } from "../user.errors";
import { AdminUserRepository } from "./admin-user.repository";
import { RideRepository } from "../../rides/ride.repository";
import type {
    AdminUserListFilters,
    SetUserStatusInput,
} from "./admin-user.types";

const STATUS_HISTORY_DEFAULT_LIMIT = 50;

const getUserList = async (
    filters: AdminUserListFilters
): Promise<AdminUserListResponse> => {
    let cursorPosition: { id: string; createdAt: Date } | undefined;

    if (filters.cursor) {
        const createdAt = await AdminUserRepository.findUserCreatedAt(
            db,
            filters.cursor
        );
        if (!createdAt) return { items: [], nextCursor: null };
        cursorPosition = { id: filters.cursor, createdAt };
    }

    const rows = await AdminUserRepository.findUserList(db, {
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
    const [user, statusHistory] = await Promise.all([
        AdminUserRepository.findUserDetailById(db, targetUserId),
        AdminUserRepository.findStatusHistoryByUserId(
            db,
            targetUserId,
            STATUS_HISTORY_DEFAULT_LIMIT
        ),
    ]);

    if (!user) {
        throw new UserError(UserErrorCodes.UserNotFound);
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
        const target = await AdminUserRepository.findUserById(tx, targetUserId);

        if (!target || target.userRole === "ADMIN") {
            throw new UserError(UserErrorCodes.UserNotFound);
        }

        if (target.userStatus === newStatus) {
            return target;
        }

        const updated = await AdminUserRepository.updateUserStatus(
            tx,
            targetUserId,
            newStatus,
            reason
        );

        if (!updated) {
            throw new UserError(UserErrorCodes.UserNotFound);
        }

        await AdminUserRepository.insertUserStatusHistory(tx, {
            userId: targetUserId,
            oldStatus: target.userStatus,
            newStatus,
            changedByUserId: actorId,
            reason,
        });

        // A suspended user is operationally identical to a banned one — the
        // auth middleware blocks them on every request, so a suspended driver
        // can no longer start/end their rides and a suspended passenger can't
        // travel. Leaving their rides/bookings "live" would strand the
        // counterparties, so SUSPENDED cascades the same cancellation as a ban.
        // Note: cancellation is irreversible, so reactivating a suspended user
        // does NOT restore their rides/bookings — reinstatement is a clean slate.
        if (
            newStatus === "BANNED" ||
            newStatus === "DELETED" ||
            newStatus === "SUSPENDED"
        ) {
            await AdminUserRepository.deleteSessionsByUserId(tx, targetUserId);

            const cancelReason =
                newStatus === "BANNED"
                    ? "User account was banned by admin"
                    : newStatus === "SUSPENDED"
                      ? "User account was suspended by admin"
                      : "User account was deleted";

            // 1. Cancel active rides (user as driver)
            const activeRides =
                await AdminUserRepository.findActiveRidesByDriverId(
                    tx,
                    targetUserId
                );

            if (activeRides.length > 0) {
                const rideIds = activeRides.map((r) => r.id);
                await AdminUserRepository.bulkCancelRides(tx, rideIds);
                await AdminUserRepository.bulkInsertRideStatusHistory(
                    tx,
                    activeRides.map((r) => ({
                        rideId: r.id,
                        oldStatus: r.rideStatus,
                        newStatus: "CANCELLED" as const,
                        changedByUserId: actorId,
                        reason: cancelReason,
                    }))
                );

                // Also cancel all active bookings for these rides
                for (const rideId of rideIds) {
                    const bookings =
                        await RideRepository.findActiveBookingsByRideId(
                            tx,
                            rideId
                        );
                    if (bookings.length > 0) {
                        const bookingIds = bookings.map((b) => b.id);
                        await RideRepository.bulkCancelBookings(
                            tx,
                            bookingIds,
                            actorId,
                            cancelReason
                        );
                        await RideRepository.bulkInsertBookingStatusHistory(
                            tx,
                            bookings.map((b) => ({
                                bookingId: b.id,
                                oldStatus: b.bookingStatus,
                                newStatus: "CANCELLED" as const,
                                changedByUserId: actorId,
                                reason: cancelReason,
                            }))
                        );
                    }
                }
            }

            // 2. Cancel active bookings (user as passenger)
            const passengerBookings =
                await AdminUserRepository.findActiveBookingsByPassengerId(
                    tx,
                    targetUserId
                );

            if (passengerBookings.length > 0) {
                const bookingIds = passengerBookings.map((b) => b.id);
                await RideRepository.bulkCancelBookings(
                    tx,
                    bookingIds,
                    actorId,
                    cancelReason
                );
                await RideRepository.bulkInsertBookingStatusHistory(
                    tx,
                    passengerBookings.map((b) => ({
                        bookingId: b.id,
                        oldStatus: b.bookingStatus,
                        newStatus: "CANCELLED" as const,
                        changedByUserId: actorId,
                        reason: cancelReason,
                    }))
                );
            }
        }

        return updated;
    });
};

export const AdminUserService = {
    getUserList,
    getUserDetail,
    setUserStatus,
};
