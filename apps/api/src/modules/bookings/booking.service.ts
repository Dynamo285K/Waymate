import { db } from "../../db";
import { BookingRepository } from "./booking.repository";
import { BookingError, BookingErrorCodes } from "./booking.errors";
import { BlockService } from "../blocks/block.service";
import type {
    BookingTimeframe,
    CreateBookingInput,
    PassengerBookingListItem,
} from "./booking.types";

const getPendingRequestsForDriver = async (driverId: string) => {
    return await BookingRepository.findPendingRequestsForDriver(db, driverId);
};

const getPassengerBookings = async (
    passengerId: string,
    timeframe?: BookingTimeframe
): Promise<PassengerBookingListItem[]> => {
    const rows = await BookingRepository.findBookingsByPassengerId(
        db,
        passengerId,
        timeframe
    );

    return rows.map(
        ({ myReviewOfDriverId, myReviewOfDriverRating, ...rest }) => ({
            ...rest,
            myReviewOfDriver:
                myReviewOfDriverId !== null && myReviewOfDriverRating !== null
                    ? {
                          id: myReviewOfDriverId,
                          rating: myReviewOfDriverRating,
                      }
                    : null,
        })
    );
};

const createBookingRequest = async (
    payload: CreateBookingInput
): Promise<string> => {
    return await db.transaction(async (tx) => {
        const ride = await BookingRepository.lockRideForBooking(
            tx,
            payload.rideId
        );

        if (!ride || ride.rideStatus !== "PLANNED") {
            throw new BookingError(BookingErrorCodes.RideNotFoundOrUnavailable);
        }

        if (ride.driverId === payload.passengerId) {
            throw new BookingError(BookingErrorCodes.SelfBookingNotAllowed);
        }

        if (
            await BlockService.isBlockedBetween(
                ride.driverId,
                payload.passengerId,
                tx
            )
        ) {
            throw new BookingError(BookingErrorCodes.Blocked);
        }

        let finalPickupStopId = payload.pickupStopId;
        let finalDropoffStopId = payload.dropoffStopId;
        let finalAmount = 0;
        let currency = "EUR";

        if (payload.pickupStopId === "dynamic" && payload.dynamicPickup) {
            finalPickupStopId = await BookingRepository.insertDynamicStop(
                tx,
                payload.rideId,
                payload.dynamicPickup.lat,
                payload.dynamicPickup.lng,
                payload.dynamicPickup.city
            );
        }

        if (payload.dropoffStopId === "dynamic" && payload.dynamicDropoff) {
            finalDropoffStopId = await BookingRepository.insertDynamicStop(
                tx,
                payload.rideId,
                payload.dynamicDropoff.lat,
                payload.dynamicDropoff.lng,
                payload.dynamicDropoff.city
            );
        }

        const stops = await BookingRepository.findRideStops(
            tx,
            payload.rideId,
            [finalPickupStopId, finalDropoffStopId]
        );

        if (stops.length !== 2) {
            throw new BookingError(BookingErrorCodes.InvalidStops);
        }

        const pickup = stops.find((s) => s.id === finalPickupStopId);
        const dropoff = stops.find((s) => s.id === finalDropoffStopId);

        if (!pickup || !dropoff || pickup.stopOrder >= dropoff.stopOrder) {
            throw new BookingError(BookingErrorCodes.InvalidStops);
        }

        if (
            payload.pickupStopId === "dynamic" ||
            payload.dropoffStopId === "dynamic"
        ) {
            finalAmount = (payload.priceAmount || 0) * payload.seatCount;
            // Fallback currency
            const firstPrice = await tx.query.prices.findFirst({
                where: (prices, { eq }) => eq(prices.rideId, payload.rideId),
            });
            currency = firstPrice?.currency || "EUR";
        } else {
            const priceRecord = await BookingRepository.findSegmentPrice(
                tx,
                payload.rideId,
                finalPickupStopId,
                finalDropoffStopId
            );

            if (!priceRecord) {
                throw new BookingError(BookingErrorCodes.PriceNotFound);
            }
            finalAmount = priceRecord.amount * payload.seatCount;
            currency = priceRecord.currency;
        }

        const heldSeats = await BookingRepository.sumSeatsForRide(
            tx,
            payload.rideId,
            ["CONFIRMED", "COMPLETED"]
        );

        if (heldSeats + payload.seatCount > ride.offeredSeats) {
            throw new BookingError(BookingErrorCodes.NotEnoughSeats);
        }

        const existingBooking =
            await BookingRepository.findActiveBookingByPassenger(
                tx,
                payload.rideId,
                payload.passengerId
            );

        if (existingBooking) {
            throw new BookingError(BookingErrorCodes.AlreadyBooked);
        }

        const newBooking = await BookingRepository.insertBooking(tx, {
            passengerId: payload.passengerId,
            rideId: payload.rideId,
            pickupStopId: finalPickupStopId,
            dropoffStopId: finalDropoffStopId,
            requestedPickupCity: payload.requestedPickupCity ?? null,
            requestedDropoffCity: payload.requestedDropoffCity ?? null,
            seatCount: payload.seatCount,
            priceAmount: finalAmount,
            currency: currency,
        });

        await BookingRepository.insertBookingStatusHistory(tx, {
            bookingId: newBooking.id,
            newStatus: "PENDING",
            changedByUserId: payload.passengerId,
            reason: "Passenger requested booking",
        });

        return newBooking.id;
    });
};

const confirmBooking = async (
    bookingId: string,
    driverId: string
): Promise<string> => {
    return await db.transaction(async (tx) => {
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
            }
        }

        return updatedBooking.id;
    });
};

const rejectBooking = async (
    bookingId: string,
    driverId: string,
    reason?: string
): Promise<string> => {
    return await db.transaction(async (tx) => {
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

        return updatedBooking.id;
    });
};

const cancelBookingByPassenger = async (
    bookingId: string,
    passengerId: string,
    reason?: string
): Promise<string> => {
    return await db.transaction(async (tx) => {
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

        return updatedBooking.id;
    });
};

const cancelBookingByDriver = async (
    bookingId: string,
    driverId: string,
    reason?: string
): Promise<string> => {
    return await db.transaction(async (tx) => {
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

        return updatedBooking.id;
    });
};

export const BookingService = {
    getPendingRequestsForDriver,
    getPassengerBookings,
    createBookingRequest,
    confirmBooking,
    rejectBooking,
    cancelBookingByPassenger,
    cancelBookingByDriver,
};
