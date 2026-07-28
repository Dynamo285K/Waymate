import {
    findPendingRequestsForDriver,
    findBookingsByPassengerId,
    findBookingDetailById,
    findCoPassengersForRide,
    sumSeatsForRide,
} from "./queries/booking-query.repository";
import {
    lockRideForBooking,
    findRideStops,
    insertDynamicStop,
    findSegmentPrice,
    findActiveBookingByPassenger,
    insertBooking,
} from "./requests/booking-request.repository";
import {
    lockBookingById,
    findPendingBookingsForRide,
    findRideDriverId,
    updateBookingFields,
    insertBookingStatusHistory,
} from "./lifecycle/booking-lifecycle.repository";

// Re-exported so consumers keep importing these types from the repository.
export type {
    RideForBookingContext,
    BookingRow,
} from "./booking.repository.shared";

export const BookingRepository = {
    findPendingRequestsForDriver,
    findBookingsByPassengerId,
    findBookingDetailById,
    findCoPassengersForRide,
    lockRideForBooking,
    lockBookingById,
    findRideStops,
    findSegmentPrice,
    sumSeatsForRide,
    findActiveBookingByPassenger,
    findPendingBookingsForRide,
    findRideDriverId,
    insertBooking,
    updateBookingFields,
    insertBookingStatusHistory,
    insertDynamicStop,
};
