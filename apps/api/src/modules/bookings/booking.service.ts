import { BookingRepository } from "./booking.repository";
import type { CreateBookingInput } from "./booking.types";

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
 * Driver rejects the passenger request (PENDING -> CANCELLED).
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

// Export the functions in the same style as RideService and UserService.
export const BookingService = {
    createBookingRequest,
    confirmBooking,
    rejectBooking,
    cancelBookingByPassenger,
};
