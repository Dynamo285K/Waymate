import {
    getPendingRequestsForDriver,
    getPassengerBookings,
} from "./queries/booking-query.service";
import { createBookingRequest } from "./requests/booking-request.service";
import {
    confirmBooking,
    rejectBooking,
    cancelBookingByPassenger,
    cancelBookingByDriver,
} from "./lifecycle/booking-lifecycle.service";

export const BookingService = {
    getPendingRequestsForDriver,
    getPassengerBookings,
    createBookingRequest,
    confirmBooking,
    rejectBooking,
    cancelBookingByPassenger,
    cancelBookingByDriver,
};
