import {
    getAvailableRides,
    getPopularRoutes,
    searchRides,
} from "./search/ride-search.service";
import { getDriverRides, getRidePassengers } from "./listing/ride-listing.service";
import { createRide } from "./creation/ride-creation.service";
import {
    cancelRide,
    endRide,
    completeRide,
    autoEndExpiredRides,
} from "./lifecycle/ride-lifecycle.service";
import {
    calculateEtasFromDurations,
    estimateEtasForStops,
} from "./eta/ride-eta.service";

// Re-exported so consumers keep importing these helpers from the service entry.
export {
    haversineKm,
    calculateEtasFromDurations,
    estimateEtasForStops,
} from "./eta/ride-eta.service";

export const RideService = {
    getAvailableRides,
    getPopularRoutes,
    getDriverRides,
    getRidePassengers,
    searchRides,
    createRide,
    cancelRide,
    endRide,
    completeRide,
    autoEndExpiredRides,
    calculateEtasFromDurations,
    estimateEtasForStops,
};
