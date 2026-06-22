import {
    findRidesByDriverId,
    findRidePassengersBundle,
    findReviewsByAuthorForSubjects,
    findAverageRatingsByUserIds,
} from "./listing/ride-listing.repository";
import {
    findAvailableRides,
    findPopularRoutes,
} from "./search/ride-discovery.repository";
import {
    searchRides,
    findStopsForRides,
    findPricesForRides,
} from "./search/ride-search.repository";
import {
    findActiveCarForDriver,
    insertRide,
    insertRideStops,
    insertRideRouteCells,
    insertRidePrices,
    insertRideStatusHistory,
    findOverlappingRidesForDriver,
} from "./creation/ride-write.repository";
import {
    findRideForCancel,
    updateRideStatusToCancelled,
    findActiveBookingsByRideId,
    findRideForEnd,
    updateRideToEnded,
    findConfirmedBookingsByRideId,
    findRidesDueForAutoEnd,
    bulkCompleteBookings,
    bulkCancelBookings,
    bulkInsertBookingStatusHistory,
} from "./lifecycle/ride-lifecycle.repository";

// Re-exported so consumers keep importing the bundle type from the repository.
export type { RidePassengersBundle } from "./listing/ride-listing.repository";

export const RideRepository = {
    findRidesByDriverId,
    findRidePassengersBundle,
    findReviewsByAuthorForSubjects,
    findAverageRatingsByUserIds,
    findAvailableRides,
    findPopularRoutes,
    searchRides,
    findActiveCarForDriver,
    insertRide,
    insertRideStops,
    insertRideRouteCells,
    insertRidePrices,
    insertRideStatusHistory,
    findRideForCancel,
    updateRideStatusToCancelled,
    findActiveBookingsByRideId,
    findRideForEnd,
    updateRideToEnded,
    findConfirmedBookingsByRideId,
    findRidesDueForAutoEnd,
    bulkCompleteBookings,
    bulkCancelBookings,
    bulkInsertBookingStatusHistory,
    findOverlappingRidesForDriver,
    findStopsForRides,
    findPricesForRides,
};
