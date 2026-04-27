import { RideRepository } from "./ride.repository";
import type { CreateRideBody, SearchRidesQuery } from "@repo/shared";
import type { RideTimeframe } from "./ride.types";

/**
 * Retrieves rides for a specific driver (split into upcoming/past).
 */
const getDriverRides = async (driverId: string, timeframe?: RideTimeframe) => {
    return await RideRepository.findRidesByDriverId(driverId, timeframe);
};

/**
 * Retrieves ride details including all confirmed passengers.
 */
const getRidePassengers = async (rideId: string, driverId: string) => {
    return await RideRepository.findRidePassengersByRideId(rideId, driverId);
};

/**
 * Searches rides from point A to point B for passengers.
 */
const searchRides = async (query: SearchRidesQuery) => {
    return await RideRepository.searchRides(
        query.startCity,
        query.destinationCity,
        query.travelDate
    );
};

/**
 * Creates a new ride as a driver.
 */
const createRide = async (driverId: string, data: CreateRideBody) => {
    // In the service layer, we merge the logged-in driver ID
    // with payload data received from the mobile app.
    return await RideRepository.createRide({
        ...data,
        driverId: driverId,
        rideStatus: "PLANNED", // Default status on creation
    });
};

/**
 * Cancels a ride by the driver (including cascading booking cancellations).
 */
const cancelRide = async (
    rideId: string,
    driverId: string,
    reason?: string
) => {
    return await RideRepository.cancelRide(rideId, driverId, reason);
};

// Export all service functions as a single object.
export const RideService = {
    getDriverRides,
    getRidePassengers,
    searchRides,
    createRide,
    cancelRide,
};
