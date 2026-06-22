import type {
    AdminRideDetailResponse,
    AdminRideListResponse,
} from "@repo/shared";
import { db } from "../../../db";
import { RideError, RideErrorCodes } from "../ride.errors";
import { AdminRideRepository } from "./admin-ride.repository";
import { RideRepository } from "../ride.repository";
import type {
    AdminCancelRideInput,
    AdminRideListFilters,
} from "./admin-ride.types";

const STATUS_HISTORY_DEFAULT_LIMIT = 50;

const getRideList = async (
    filters: AdminRideListFilters
): Promise<AdminRideListResponse> => {
    let cursorPosition: { id: string; createdAt: Date } | undefined;

    if (filters.cursor) {
        const createdAt = await AdminRideRepository.findRideCreatedAt(
            db,
            filters.cursor
        );
        if (!createdAt) return { items: [], nextCursor: null };
        cursorPosition = { id: filters.cursor, createdAt };
    }

    const rows = await AdminRideRepository.findRideList(db, {
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
        AdminRideRepository.findRideDetailById(db, rideId),
        AdminRideRepository.findRideStatusHistoryByRideId(
            db,
            rideId,
            STATUS_HISTORY_DEFAULT_LIMIT
        ),
    ]);

    if (!ride) {
        throw new RideError(RideErrorCodes.RideNotFound);
    }

    return { ride, statusHistory };
};

const cancelRide = async ({
    actorId,
    rideId,
    reason,
}: AdminCancelRideInput): Promise<{ id: string; status: "CANCELLED" }> => {
    return await db.transaction(async (tx) => {
        const ride = await AdminRideRepository.findRideForAdminCancel(
            tx,
            rideId
        );

        if (!ride) {
            throw new RideError(RideErrorCodes.RideNotFound);
        }

        if (ride.rideStatus === "CANCELLED") {
            throw new RideError(RideErrorCodes.RideAlreadyCancelled);
        }

        // Force cancel only applies to a ride that hasn't run yet. Once it has
        // finished (COMPLETED) or departed (IN_PROGRESS) there's nothing to
        // cancel — those states are rejected so the action stays meaningful.
        if (ride.rideStatus === "COMPLETED") {
            throw new RideError(RideErrorCodes.RideAlreadyCompleted);
        }

        if (ride.rideStatus !== "PLANNED") {
            throw new RideError(RideErrorCodes.RideAlreadyDeparted);
        }

        const updated =
            await AdminRideRepository.updateRideStatusToCancelledById(
                tx,
                rideId
            );

        if (!updated) {
            throw new RideError(RideErrorCodes.RideNotFound);
        }

        await AdminRideRepository.insertRideStatusHistoryRow(tx, {
            rideId: updated.id,
            oldStatus: ride.rideStatus,
            newStatus: "CANCELLED",
            changedByUserId: actorId,
            reason,
        });

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

export const AdminRideService = {
    getRideList,
    getRideDetail,
    cancelRide,
};
