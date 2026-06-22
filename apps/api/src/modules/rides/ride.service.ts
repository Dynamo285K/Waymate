import {
    getAvailableRides,
    getPopularRoutes,
    searchRides,
} from "./ride-search.service";
import { getDriverRides, getRidePassengers } from "./ride-listing.service";
import { createRide } from "./ride-creation.service";
import {
    cancelRide,
    endRide,
    completeRide,
    autoEndExpiredRides,
} from "./ride-lifecycle.service";
import {
    calculateEtasFromDurations,
    estimateEtasForStops,
} from "./ride-eta.service";

// Re-exported so consumers keep importing these helpers from the service entry.
export {
    haversineKm,
    calculateEtasFromDurations,
    estimateEtasForStops,
} from "./ride-eta.service";

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
