import { db } from "../../../db";
import { RideRepository } from "../ride.repository";
import { RideError, RideErrorCodes } from "../ride.errors";
import { NotificationService } from "../../notifications/notification.service";
import type { CreatedNotification } from "../../notifications/notification.types";
import type { EndRideInput } from "../ride.types";

export const cancelRide = async (
    rideId: string,
    driverId: string,
    reason?: string
): Promise<string> => {
    const { id, created } = await db.transaction(async (tx) => {
        const existingRide = await RideRepository.findRideForCancel(
            tx,
            rideId,
            driverId
        );

        if (!existingRide) {
            throw new RideError(RideErrorCodes.RideNotFoundOrNotOwner);
        }

        if (existingRide.rideStatus === "CANCELLED") {
            throw new RideError(RideErrorCodes.RideAlreadyCancelled);
        }

        const updatedRide = await RideRepository.updateRideStatusToCancelled(
            tx,
            rideId,
            driverId
        );

        if (!updatedRide) {
            // Race: ride was soft-deleted between the existence check and
            // the update. Roll back to keep status history consistent.
            throw new RideError(RideErrorCodes.RideNotFoundOrNotOwner);
        }

        await RideRepository.insertRideStatusHistory(tx, {
            rideId: updatedRide.id,
            oldStatus: existingRide.rideStatus,
            newStatus: "CANCELLED",
            changedByUserId: driverId,
            reason: reason || "Ride cancelled by driver",
        });

        const activeBookings = await RideRepository.findActiveBookingsByRideId(
            tx,
            rideId
        );

        const created: CreatedNotification[] = [];

        if (activeBookings.length > 0) {
            const cancelReason = "Ride was cancelled by the driver";
            const activeBookingIds = activeBookings.map((b) => b.id);

            await RideRepository.bulkCancelBookings(
                tx,
                activeBookingIds,
                driverId,
                cancelReason
            );

            const bookingHistoryInserts = activeBookings.map((b) => ({
                bookingId: b.id,
                oldStatus: b.bookingStatus,
                newStatus: "CANCELLED" as const,
                changedByUserId: driverId,
                reason: cancelReason,
            }));

            await RideRepository.bulkInsertBookingStatusHistory(
                tx,
                bookingHistoryInserts
            );

            const payloadBase = await NotificationService.ridePayload(
                tx,
                rideId
            );

            for (const booking of activeBookings) {
                created.push(
                    await NotificationService.create(tx, {
                        userId: booking.passengerId,
                        type: "RIDE_CANCELLED",
                        referenceEntityType: "RIDE",
                        referenceEntityId: rideId,
                        payload: { ...payloadBase, bookingId: booking.id },
                    })
                );
            }
        }

        return { id: updatedRide.id, created };
    });

    NotificationService.publishCreated(created);

    return id;
};

export const endRide = async (input: EndRideInput): Promise<string> => {
    const actorUserId = input.actorUserId ?? null;
    if (input.source !== "AUTO" && !actorUserId) {
        throw new RideError(RideErrorCodes.RideNotFoundOrNotOwner);
    }

    const endedAt = input.endedAt ?? new Date();
    const driverId = input.source === "DRIVER" ? actorUserId! : undefined;
    const endedByUserId = input.source === "AUTO" ? null : actorUserId;
    const endReason = input.reason || defaultEndReason(input.source);

    const { id, created } = await db.transaction(async (tx) => {
        const ride = await RideRepository.findRideForEnd(
            tx,
            input.rideId,
            driverId
        );

        if (!ride) {
            throw new RideError(RideErrorCodes.RideNotFoundOrNotOwner);
        }

        if (ride.rideStatus === "COMPLETED") {
            return { id: ride.id, created: [] as CreatedNotification[] };
        }

        if (
            ride.rideStatus !== "PLANNED" &&
            ride.rideStatus !== "IN_PROGRESS"
        ) {
            throw new RideError(RideErrorCodes.RideNotCompletable);
        }

        // Guard against marking a future ride complete — the review window and
        // "past rides" listing both assume a COMPLETED ride has actually run.
        if (ride.departureAt > endedAt) {
            throw new RideError(RideErrorCodes.RideNotDeparted);
        }

        const updatedRide = await RideRepository.updateRideToEnded(tx, {
            rideId: input.rideId,
            driverId,
            endedAt,
            endedByUserId,
            endSource: input.source,
            endReason,
            autoEndProcessedAt: input.source === "AUTO" ? endedAt : null,
        });

        if (!updatedRide) {
            const currentRide = await RideRepository.findRideForEnd(
                tx,
                input.rideId,
                driverId
            );

            if (currentRide?.rideStatus === "COMPLETED") {
                return {
                    id: currentRide.id,
                    created: [] as CreatedNotification[],
                };
            }

            if (currentRide) {
                throw new RideError(RideErrorCodes.RideNotCompletable);
            }

            throw new RideError(RideErrorCodes.RideNotFoundOrNotOwner);
        }

        await RideRepository.insertRideStatusHistory(tx, {
            rideId: updatedRide.id,
            oldStatus: ride.rideStatus,
            newStatus: "COMPLETED",
            changedByUserId: endedByUserId,
            reason: endReason,
        });

        // Carry confirmed bookings to COMPLETED so the rating window opens for
        // both sides and the passenger's "past rides" reflects reality. PENDING
        // requests are left untouched — they were never accepted.
        const confirmedBookings =
            await RideRepository.findConfirmedBookingsByRideId(
                tx,
                input.rideId
            );

        const created: CreatedNotification[] = [];

        if (confirmedBookings.length > 0) {
            const bookingIds = confirmedBookings.map((b) => b.id);

            await RideRepository.bulkCompleteBookings(tx, bookingIds);

            await RideRepository.bulkInsertBookingStatusHistory(
                tx,
                confirmedBookings.map((b) => ({
                    bookingId: b.id,
                    oldStatus: b.bookingStatus,
                    newStatus: "COMPLETED" as const,
                    changedByUserId: endedByUserId,
                    reason: endReason,
                }))
            );

            const payloadBase = await NotificationService.ridePayload(
                tx,
                input.rideId
            );

            for (const booking of confirmedBookings) {
                created.push(
                    await NotificationService.create(tx, {
                        userId: booking.passengerId,
                        type: "RIDE_COMPLETED",
                        referenceEntityType: "RIDE",
                        referenceEntityId: input.rideId,
                        payload: { ...payloadBase, bookingId: booking.id },
                    })
                );
            }
        }

        return { id: updatedRide.id, created };
    });

    NotificationService.publishCreated(created);

    return id;
};

const defaultEndReason = (source: EndRideInput["source"]) => {
    switch (source) {
        case "AUTO":
            return "Ride ended automatically";
        case "ADMIN":
            return "Ride ended by admin";
        case "DRIVER":
            return "Ride ended by driver";
    }
};

export const completeRide = async (
    rideId: string,
    driverId: string,
    reason?: string
): Promise<string> => {
    return await endRide({
        rideId,
        actorUserId: driverId,
        source: "DRIVER",
        reason,
    });
};

export const autoEndExpiredRides = async ({
    now = new Date(),
    limit,
}: {
    now?: Date;
    limit: number;
}): Promise<{
    candidates: number;
    processed: number;
    failed: number;
    failures: { rideId: string; error: string }[];
}> => {
    const dueRides = await RideRepository.findRidesDueForAutoEnd(
        db,
        now,
        limit
    );
    const failures: { rideId: string; error: string }[] = [];
    let processed = 0;

    for (const ride of dueRides) {
        try {
            await endRide({
                rideId: ride.id,
                source: "AUTO",
                endedAt: now,
            });
            processed += 1;
        } catch (error) {
            failures.push({
                rideId: ride.id,
                error:
                    error instanceof Error
                        ? error.message
                        : "Unknown auto-end error",
            });
        }
    }

    return {
        candidates: dueRides.length,
        processed,
        failed: failures.length,
        failures,
    };
};
