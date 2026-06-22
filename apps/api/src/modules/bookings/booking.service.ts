import {
    getPendingRequestsForDriver,
    getPassengerBookings,
} from "./booking-query.service";
import { createBookingRequest } from "./booking-request.service";
import {
    confirmBooking,
    rejectBooking,
    cancelBookingByPassenger,
    cancelBookingByDriver,
} from "./booking-lifecycle.service";

export const BookingService = {
    getPendingRequestsForDriver,
    getPassengerBookings,
    createBookingRequest,
    confirmBooking,
    rejectBooking,
    cancelBookingByPassenger,
    cancelBookingByDriver,
};
