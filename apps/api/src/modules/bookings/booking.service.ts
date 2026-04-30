import { db } from "../../db";
import { BookingRepository } from "./booking.repository";
import { BookingErrors } from "./booking.errors";
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
            throw new Error(BookingErrors.RideNotFoundOrUnavailable);
        }

        if (ride.driverId === payload.passengerId) {
            throw new Error(BookingErrors.SelfBookingNotAllowed);
        }

        const stops = await BookingRepository.findRideStops(
            tx,
            payload.rideId,
            [payload.pickupStopId, payload.dropoffStopId]
        );

        if (stops.length !== 2) {
            throw new Error(BookingErrors.InvalidStops);
        }

        const pickup = stops.find((s) => s.id === payload.pickupStopId);
        const dropoff = stops.find((s) => s.id === payload.dropoffStopId);

        if (!pickup || !dropoff || pickup.stopOrder >= dropoff.stopOrder) {
            throw new Error(BookingErrors.InvalidStops);
        }

        const priceRecord = await BookingRepository.findSegmentPrice(
            tx,
            payload.rideId,
            payload.pickupStopId,
            payload.dropoffStopId
        );

        if (!priceRecord) {
            throw new Error(BookingErrors.PriceNotFound);
        }

        const heldSeats = await BookingRepository.sumSeatsForRide(
            tx,
            payload.rideId,
            ["PENDING", "CONFIRMED"]
        );

        if (heldSeats + payload.seatCount > ride.offeredSeats) {
            throw new Error(BookingErrors.NotEnoughSeats);
        }

        const existingBooking =
            await BookingRepository.findActiveBookingByPassenger(
                tx,
                payload.rideId,
                payload.passengerId
            );

        if (existingBooking) {
            throw new Error(BookingErrors.AlreadyBooked);
        }

        const totalAmount = priceRecord.amount * payload.seatCount;

        const newBooking = await BookingRepository.insertBooking(tx, {
            passengerId: payload.passengerId,
            rideId: payload.rideId,
            pickupStopId: payload.pickupStopId,
            dropoffStopId: payload.dropoffStopId,
            seatCount: payload.seatCount,
            priceAmount: totalAmount,
            currency: priceRecord.currency,
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
            throw new Error(BookingErrors.InvalidStatusTransition);
        }

        const ride = await BookingRepository.lockRideForBooking(
            tx,
            booking.rideId
        );

        if (!ride) {
            throw new Error(BookingErrors.RideNotFoundOrUnavailable);
        }

        if (ride.driverId !== driverId) {
            throw new Error(BookingErrors.UnauthorizedAction);
        }

        if (ride.rideStatus !== "PLANNED") {
            throw new Error(BookingErrors.RideNotFoundOrUnavailable);
        }

        const confirmedSeats = await BookingRepository.sumSeatsForRide(
            tx,
            ride.id,
            ["CONFIRMED"]
        );

        if (confirmedSeats + booking.seatCount > ride.offeredSeats) {
            throw new Error(BookingErrors.NotEnoughSeats);
        }

        const updatedBooking = await BookingRepository.updateBookingFields(
            tx,
            bookingId,
            {
                bookingStatus: "CONFIRMED",
                confirmedAt: new Date(),
            }
        );

        await BookingRepository.insertBookingStatusHistory(tx, {
            bookingId: updatedBooking.id,
            oldStatus: "PENDING",
            newStatus: "CONFIRMED",
            changedByUserId: driverId,
            reason: "Driver confirmed booking",
        });

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
            throw new Error(BookingErrors.InvalidStatusTransition);
        }

        const ride = await BookingRepository.lockRideForBooking(
            tx,
            booking.rideId
        );

        if (!ride) {
            throw new Error(BookingErrors.RideNotFoundOrUnavailable);
        }

        if (ride.driverId !== driverId) {
            throw new Error(BookingErrors.UnauthorizedAction);
        }

        if (ride.rideStatus !== "PLANNED") {
            throw new Error(BookingErrors.RideNotFoundOrUnavailable);
        }

        const rejectionReason = reason || "Driver rejected booking";

        const updatedBooking = await BookingRepository.updateBookingFields(
            tx,
            bookingId,
            { bookingStatus: "REJECTED" }
        );

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
            throw new Error(BookingErrors.BookingNotFound);
        }

        if (booking.passengerId !== passengerId) {
            throw new Error(BookingErrors.UnauthorizedAction);
        }

        if (booking.bookingStatus === "CANCELLED") {
            throw new Error(BookingErrors.AlreadyCancelled);
        }

        if (!["PENDING", "CONFIRMED"].includes(booking.bookingStatus)) {
            throw new Error(BookingErrors.InvalidStatusTransition);
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
            throw new Error(BookingErrors.BookingNotFound);
        }

        if (booking.bookingStatus === "CANCELLED") {
            throw new Error(BookingErrors.AlreadyCancelled);
        }

        if (!["PENDING", "CONFIRMED"].includes(booking.bookingStatus)) {
            throw new Error(BookingErrors.InvalidStatusTransition);
        }

        const ride = await BookingRepository.lockRideForBooking(
            tx,
            booking.rideId
        );

        if (!ride) {
            throw new Error(BookingErrors.RideNotFoundOrUnavailable);
        }

        if (ride.driverId !== driverId) {
            throw new Error(BookingErrors.UnauthorizedAction);
        }

        if (ride.rideStatus !== "PLANNED") {
            throw new Error(BookingErrors.RideNotFoundOrUnavailable);
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
