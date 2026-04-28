import { BookingRepository } from "./booking.repository";
import type { BookingTimeframe, CreateBookingInput } from "./booking.types";

const getPendingRequestsForDriver = async (driverId: string) => {
    return await BookingRepository.findPendingRequestsForDriver(driverId);
};

/**
 * Returns bookings created by the authenticated passenger.
 */

const getPassengerBookings = async (
    passengerId: string,
    timeframe?: BookingTimeframe
) => {
    return await BookingRepository.findBookingsByPassengerId(
        passengerId,
        timeframe
    );
};

/**
 * Creates a pending booking request for a passenger.
 */
const createBookingRequest = async (
    payload: CreateBookingInput
): Promise<string> => {
    return await BookingRepository.createBookingRequest(payload);
};

/**
 * Driver confirms the passenger request (PENDING -> CONFIRMED).
 */
const confirmBooking = async (
    bookingId: string,
    driverId: string
): Promise<string> => {
    return await BookingRepository.confirmBooking(bookingId, driverId);
};

/**
 * Driver rejects the passenger request (PENDING -> REJECTED).
 */
const rejectBooking = async (
    bookingId: string,
    driverId: string,
    reason?: string
): Promise<string> => {
    return await BookingRepository.rejectBooking(bookingId, driverId, reason);
};

/**
 * Passenger cancels their own booking (PENDING / CONFIRMED -> CANCELLED).
 */
const cancelBookingByPassenger = async (
    bookingId: string,
    passengerId: string,
    reason?: string
): Promise<string> => {
    return await BookingRepository.cancelBookingByPassenger(
        bookingId,
        passengerId,
        reason
    );
};

const cancelBookingByDriver = async (
    bookingId: string,
    driverId: string,
    reason?: string
): Promise<string> => {
    return await BookingRepository.cancelBookingByDriver(
        bookingId,
        driverId,
        reason
    );
};

// Export the functions in the same style as RideService and UserService.
export const BookingService = {
    getPendingRequestsForDriver,
    getPassengerBookings,
    createBookingRequest,
    confirmBooking,
    rejectBooking,
    cancelBookingByPassenger,
    cancelBookingByDriver,
};
