import { db } from "../../db";
import { RideRepository } from "./ride.repository";
import { RideError, RideErrorCodes } from "./ride.errors";
import { REVIEW_WINDOW_DAYS } from "../reviews/review.service";
import type { CreateRideBody, SearchRidesQuery } from "@repo/shared";
import type {
    CreateRideInput,
    RidePassengersView,
    RideTimeframe,
} from "./ride.types";

const getAvailableRides = async () => {
    return await RideRepository.findAvailableRides(db);
};

const getDriverRides = async (driverId: string, timeframe?: RideTimeframe) => {
    return await RideRepository.findRidesByDriverId(db, driverId, timeframe);
};

const getRidePassengers = async (
    rideId: string,
    driverId: string
): Promise<RidePassengersView> => {
    const data = await RideRepository.findRideWithPassengers(
        db,
        rideId,
        driverId
    );

    if (!data) throw new RideError(RideErrorCodes.RideNotFoundOrNotOwner);

    const windowClosesAt = new Date(
        data.ride.departureAt.getTime() +
            REVIEW_WINDOW_DAYS * 24 * 60 * 60 * 1000
    );
    const canReview =
        data.ride.rideStatus === "COMPLETED" && new Date() <= windowClosesAt;

    return {
        ...data,
        ride: {
            ...data.ride,
            canReview,
        },
    };
};

const searchRides = async (query: SearchRidesQuery) => {
    return await RideRepository.searchRides(
        db,
        query.startCity,
        query.destinationCity,
        query.travelDate
    );
};

const createRide = async (driverId: string, data: CreateRideBody) => {
    const input: CreateRideInput = {
        ...data,
        driverId,
        rideStatus: "PLANNED",
    };

    return await db.transaction(async (tx) => {
        const car = await RideRepository.findActiveCarForDriver(
            tx,
            input.carId,
            input.driverId
        );

        if (!car) {
            throw new RideError(RideErrorCodes.CarNotAvailableForDriver);
        }

        const newRide = await RideRepository.insertRide(tx, {
            driverId: input.driverId,
            carId: input.carId,
            departureAt: input.departureAt,
            arrivalEstimateAt: input.arrivalEstimateAt,
            rideStatus: input.rideStatus || "PLANNED",
            offeredSeats: input.offeredSeats,
            currency: input.currency,
            description: input.description,
        });

        const stopsToInsert = input.stops.map((stop, index) => ({
            rideId: newRide.id,
            stopOrder: index,
            address: stop.address,
            city: stop.city,
            countryCode: stop.countryCode,
            lat: stop.lat,
            lng: stop.lng,
            plannedArrivalAt: stop.plannedArrivalAt,
            plannedDepartureAt: stop.plannedDepartureAt,
        }));

        const insertedStops = await RideRepository.insertRideStops(
            tx,
            stopsToInsert
        );

        if (input.prices && input.prices.length > 0) {
            const pricesToInsert = input.prices.map((priceParam) => {
                const startStop = insertedStops.find(
                    (s) => s.stopOrder === priceParam.startStopOrder
                );
                const endStop = insertedStops.find(
                    (s) => s.stopOrder === priceParam.endStopOrder
                );

                if (!startStop || !endStop) {
                    throw new RideError(RideErrorCodes.InvalidPriceStopOrders);
                }

                return {
                    rideId: newRide.id,
                    startStopId: startStop.id,
                    endStopId: endStop.id,
                    amount: priceParam.amount,
                    currency: priceParam.currency || newRide.currency,
                };
            });

            await RideRepository.insertRidePrices(tx, pricesToInsert);
        }

        await RideRepository.insertRideStatusHistory(tx, {
            rideId: newRide.id,
            newStatus: newRide.rideStatus,
            changedByUserId: input.changedByUserId || input.driverId,
            reason: input.reason || "Ride successfully created",
        });

        return newRide.id;
    });
};

const cancelRide = async (
    rideId: string,
    driverId: string,
    reason?: string
): Promise<string> => {
    return await db.transaction(async (tx) => {
        const existingRide = await RideRepository.findRideForCancel(
            tx,
            rideId,
            driverId
        );

        if (!existingRide) {
            throw new RideError(RideErrorCodes.RideNotFoundOrNotOwner);
        }

        if (existingRide.rideStatus === "CANCELLED") {
            throw new RideError(RideErrorCodes.RideAlreadyCancelled);
        }

        const updatedRide = await RideRepository.updateRideStatusToCancelled(
            tx,
            rideId,
            driverId
        );

        await RideRepository.insertRideStatusHistory(tx, {
            rideId: updatedRide.id,
            oldStatus: existingRide.rideStatus,
            newStatus: "CANCELLED",
            changedByUserId: driverId,
            reason: reason || "Ride cancelled by driver",
        });

        const activeBookings = await RideRepository.findActiveBookingsByRideId(
            tx,
            rideId
        );

        if (activeBookings.length > 0) {
            const cancelReason = "Ride was cancelled by the driver";
            const activeBookingIds = activeBookings.map((b) => b.id);

            await RideRepository.bulkCancelBookings(
                tx,
                activeBookingIds,
                driverId,
                cancelReason
            );

            const bookingHistoryInserts = activeBookings.map((b) => ({
                bookingId: b.id,
                oldStatus: b.bookingStatus,
                newStatus: "CANCELLED" as const,
                changedByUserId: driverId,
                reason: cancelReason,
            }));

            await RideRepository.bulkInsertBookingStatusHistory(
                tx,
                bookingHistoryInserts
            );
        }

        return updatedRide.id;
    });
};

export const RideService = {
    getAvailableRides,
    getDriverRides,
    getRidePassengers,
    searchRides,
    createRide,
    cancelRide,
};
