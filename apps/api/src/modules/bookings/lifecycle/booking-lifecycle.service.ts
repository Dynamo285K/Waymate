import { db } from "../../../db";
import { BookingRepository } from "../booking.repository";
import { BookingError, BookingErrorCodes } from "../booking.errors";
import { NotificationService } from "../../notifications/notification.service";

export const confirmBooking = async (
    bookingId: string,
    driverId: string
): Promise<string> => {
    const { id, created } = await db.transaction(async (tx) => {
        const booking = await BookingRepository.lockBookingById(tx, bookingId);

        if (!booking || booking.bookingStatus !== "PENDING") {
            throw new BookingError(BookingErrorCodes.InvalidStatusTransition);
        }

        const ride = await BookingRepository.lockRideForBooking(
            tx,
            booking.rideId
        );

        if (!ride) {
            throw new BookingError(BookingErrorCodes.RideNotFoundOrUnavailable);
        }

        if (ride.driverId !== driverId) {
            throw new BookingError(BookingErrorCodes.UnauthorizedAction);
        }

        if (ride.rideStatus !== "PLANNED") {
            throw new BookingError(BookingErrorCodes.RideNotFoundOrUnavailable);
        }

        const confirmedSeats = await BookingRepository.sumSeatsForRide(
            tx,
            ride.id,
            ["CONFIRMED"]
        );

        if (confirmedSeats + booking.seatCount > ride.offeredSeats) {
            throw new BookingError(BookingErrorCodes.NotEnoughSeats);
        }

        const updatedBooking = await BookingRepository.updateBookingFields(
            tx,
            bookingId,
            {
                bookingStatus: "CONFIRMED",
                confirmedAt: new Date(),
            }
        );

        if (!updatedBooking) {
            // Race: booking was soft-deleted between the lock and the update.
            // Roll back so status history stays consistent with bookings.
            throw new BookingError(BookingErrorCodes.BookingNotFound);
        }

        await BookingRepository.insertBookingStatusHistory(tx, {
            bookingId: updatedBooking.id,
            oldStatus: "PENDING",
            newStatus: "CONFIRMED",
            changedByUserId: driverId,
            reason: "Driver confirmed booking",
        });

        const payloadBase = await NotificationService.ridePayload(
            tx,
            booking.rideId
        );

        const created = [
            await NotificationService.create(tx, {
                userId: booking.passengerId,
                type: "BOOKING_CONFIRMED",
                referenceEntityType: "BOOKING",
                referenceEntityId: updatedBooking.id,
                payload: { ...payloadBase, bookingId: updatedBooking.id },
            }),
        ];

        const newConfirmedSeats = confirmedSeats + booking.seatCount;
        const seatsLeft = Math.max(0, ride.offeredSeats - newConfirmedSeats);

        const pendingBookings =
            await BookingRepository.findPendingBookingsForRide(tx, ride.id);

        for (const pending of pendingBookings) {
            if (pending.seatCount > seatsLeft) {
                await BookingRepository.updateBookingFields(tx, pending.id, {
                    bookingStatus: "REJECTED",
                });

                await BookingRepository.insertBookingStatusHistory(tx, {
                    bookingId: pending.id,
                    oldStatus: "PENDING",
                    newStatus: "REJECTED",
                    changedByUserId: driverId,
                    reason: "System auto-rejected: Ride reached maximum capacity",
                });

                created.push(
                    await NotificationService.create(tx, {
                        userId: pending.passengerId,
                        type: "BOOKING_REJECTED",
                        referenceEntityType: "BOOKING",
                        referenceEntityId: pending.id,
                        payload: { ...payloadBase, bookingId: pending.id },
                    })
                );
            }
        }

        return { id: updatedBooking.id, created };
    });

    NotificationService.publishCreated(created);

    return id;
};

export const rejectBooking = async (
    bookingId: string,
    driverId: string,
    reason?: string
): Promise<string> => {
    const { id, created } = await db.transaction(async (tx) => {
        const booking = await BookingRepository.lockBookingById(tx, bookingId);

        if (!booking || booking.bookingStatus !== "PENDING") {
            throw new BookingError(BookingErrorCodes.InvalidStatusTransition);
        }

        const ride = await BookingRepository.lockRideForBooking(
            tx,
            booking.rideId
        );

        if (!ride) {
            throw new BookingError(BookingErrorCodes.RideNotFoundOrUnavailable);
        }

        if (ride.driverId !== driverId) {
            throw new BookingError(BookingErrorCodes.UnauthorizedAction);
        }

        if (ride.rideStatus !== "PLANNED") {
            throw new BookingError(BookingErrorCodes.RideNotFoundOrUnavailable);
        }

        const rejectionReason = reason || "Driver rejected booking";

        const updatedBooking = await BookingRepository.updateBookingFields(
            tx,
            bookingId,
            { bookingStatus: "REJECTED" }
        );

        if (!updatedBooking) {
            throw new BookingError(BookingErrorCodes.BookingNotFound);
        }

        await BookingRepository.insertBookingStatusHistory(tx, {
            bookingId: updatedBooking.id,
            oldStatus: "PENDING",
            newStatus: "REJECTED",
            changedByUserId: driverId,
            reason: rejectionReason,
        });

        const created = await NotificationService.create(tx, {
            userId: booking.passengerId,
            type: "BOOKING_REJECTED",
            referenceEntityType: "BOOKING",
            referenceEntityId: updatedBooking.id,
            payload: {
                ...(await NotificationService.ridePayload(tx, booking.rideId)),
                bookingId: updatedBooking.id,
            },
        });

        return { id: updatedBooking.id, created: [created] };
    });

    NotificationService.publishCreated(created);

    return id;
};

export const cancelBookingByPassenger = async (
    bookingId: string,
    passengerId: string,
    reason?: string
): Promise<string> => {
    const { id, created } = await db.transaction(async (tx) => {
        const booking = await BookingRepository.lockBookingById(tx, bookingId);

        if (!booking) {
            throw new BookingError(BookingErrorCodes.BookingNotFound);
        }

        if (booking.passengerId !== passengerId) {
            throw new BookingError(BookingErrorCodes.UnauthorizedAction);
        }

        if (booking.bookingStatus === "CANCELLED") {
            throw new BookingError(BookingErrorCodes.AlreadyCancelled);
        }

        if (!["PENDING", "CONFIRMED"].includes(booking.bookingStatus)) {
            throw new BookingError(BookingErrorCodes.InvalidStatusTransition);
        }

        const cancelReason = reason || "Passenger cancelled their booking";

        const updatedBooking = await BookingRepository.updateBookingFields(
            tx,
            bookingId,
            {
                bookingStatus: "CANCELLED",
                cancelledAt: new Date(),
                cancelledByUserId: passengerId,
                cancellationReason: cancelReason,
            }
        );

        if (!updatedBooking) {
            throw new BookingError(BookingErrorCodes.BookingNotFound);
        }

        await BookingRepository.insertBookingStatusHistory(tx, {
            bookingId: updatedBooking.id,
            oldStatus: booking.bookingStatus,
            newStatus: "CANCELLED",
            changedByUserId: passengerId,
            reason: cancelReason,
        });

        // Notify the driver. Plain lookup, not lockRideForBooking — the ride
        // row itself is not mutated by a passenger cancellation.
        const driverId = await BookingRepository.findRideDriverId(
            tx,
            booking.rideId
        );

        const created = driverId
            ? [
                  await NotificationService.create(tx, {
                      userId: driverId,
                      type: "BOOKING_CANCELLED",
                      referenceEntityType: "BOOKING",
                      referenceEntityId: updatedBooking.id,
                      payload: {
                          ...(await NotificationService.ridePayload(
                              tx,
                              booking.rideId
                          )),
                          bookingId: updatedBooking.id,
                          cancelledBy: "PASSENGER" as const,
                          actorName: await NotificationService.actorName(
                              tx,
                              passengerId
                          ),
                      },
                  }),
              ]
            : [];

        return { id: updatedBooking.id, created };
    });

    NotificationService.publishCreated(created);

    return id;
};

export const cancelBookingByDriver = async (
    bookingId: string,
    driverId: string,
    reason?: string
): Promise<string> => {
    const { id, created } = await db.transaction(async (tx) => {
        const booking = await BookingRepository.lockBookingById(tx, bookingId);

        if (!booking) {
            throw new BookingError(BookingErrorCodes.BookingNotFound);
        }

        if (booking.bookingStatus === "CANCELLED") {
            throw new BookingError(BookingErrorCodes.AlreadyCancelled);
        }

        if (!["PENDING", "CONFIRMED"].includes(booking.bookingStatus)) {
            throw new BookingError(BookingErrorCodes.InvalidStatusTransition);
        }

        const ride = await BookingRepository.lockRideForBooking(
            tx,
            booking.rideId
        );

        if (!ride) {
            throw new BookingError(BookingErrorCodes.RideNotFoundOrUnavailable);
        }

        if (ride.driverId !== driverId) {
            throw new BookingError(BookingErrorCodes.UnauthorizedAction);
        }

        if (ride.rideStatus !== "PLANNED") {
            throw new BookingError(BookingErrorCodes.RideNotFoundOrUnavailable);
        }

        const cancelReason = reason || "Driver cancelled passenger booking";

        const updatedBooking = await BookingRepository.updateBookingFields(
            tx,
            bookingId,
            {
                bookingStatus: "CANCELLED",
                cancelledAt: new Date(),
                cancelledByUserId: driverId,
                cancellationReason: cancelReason,
            }
        );

        if (!updatedBooking) {
            throw new BookingError(BookingErrorCodes.BookingNotFound);
        }

        await BookingRepository.insertBookingStatusHistory(tx, {
            bookingId: updatedBooking.id,
            oldStatus: booking.bookingStatus,
            newStatus: "CANCELLED",
            changedByUserId: driverId,
            reason: cancelReason,
        });

        const created = await NotificationService.create(tx, {
            userId: booking.passengerId,
            type: "BOOKING_CANCELLED",
            referenceEntityType: "BOOKING",
            referenceEntityId: updatedBooking.id,
            payload: {
                ...(await NotificationService.ridePayload(tx, booking.rideId)),
                bookingId: updatedBooking.id,
                cancelledBy: "DRIVER" as const,
            },
        });

        return { id: updatedBooking.id, created: [created] };
    });

    NotificationService.publishCreated(created);

    return id;
};
