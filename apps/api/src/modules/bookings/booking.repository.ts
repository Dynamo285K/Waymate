import {
    findPendingRequestsForDriver,
    findBookingsByPassengerId,
} from "./booking-query.repository";
import {
    lockRideForBooking,
    lockBookingById,
    findRideStops,
    insertDynamicStop,
    findSegmentPrice,
    sumSeatsForRide,
    findActiveBookingByPassenger,
    findPendingBookingsForRide,
    insertBooking,
    updateBookingFields,
    insertBookingStatusHistory,
} from "./booking-mutation.repository";

// Re-exported so consumers keep importing these types from the repository.
export type {
    RideForBookingContext,
    BookingRow,
} from "./booking.repository.shared";

export const BookingRepository = {
    findPendingRequestsForDriver,
    findBookingsByPassengerId,
    lockRideForBooking,
    lockBookingById,
    findRideStops,
    findSegmentPrice,
    sumSeatsForRide,
    findActiveBookingByPassenger,
    findPendingBookingsForRide,
    insertBooking,
    updateBookingFields,
    insertBookingStatusHistory,
    insertDynamicStop,
};
