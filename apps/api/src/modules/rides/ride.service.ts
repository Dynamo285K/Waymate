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
    const bundle = await RideRepository.findRidePassengersBundle(
        db,
        rideId,
        driverId
    );

    if (!bundle) throw new RideError(RideErrorCodes.RideNotFoundOrNotOwner);

    // Independent SELECT — driver's own reviews of these passengers, used to
    // surface "already reviewed" state in the UI. Empty subjectIds short-
    // circuits inside the repo function.
    const passengerIds = bundle.bookings.map((b) => b.passenger.id);
    const driverReviews = await RideRepository.findReviewsByAuthorForSubjects(
        db,
        rideId,
        driverId,
        passengerIds
    );
    const reviewBySubject = new Map(
        driverReviews.map((r) => [r.subjectId, { id: r.id, rating: r.rating }])
    );

    const windowClosesAt = new Date(
        bundle.departureAt.getTime() + REVIEW_WINDOW_DAYS * 24 * 60 * 60 * 1000
    );
    const canReview =
        bundle.rideStatus === "COMPLETED" && new Date() <= windowClosesAt;

    return {
        ride: {
            id: bundle.id,
            departureAt: bundle.departureAt,
            rideStatus: bundle.rideStatus,
            offeredSeats: bundle.offeredSeats,
            currency: bundle.currency,
            rideStops: bundle.rideStops,
            canReview,
        },
        passengerCount: bundle.bookings.reduce(
            (sum, b) => sum + b.seatCount,
            0
        ),
        passengers: bundle.bookings.map((b) => ({
            bookingId: b.id,
            bookingStatus: b.bookingStatus,
            seatCount: b.seatCount,
            passenger: b.passenger,
            pickupStop: b.pickupStop,
            dropoffStop: b.dropoffStop,
            myReviewOfPassenger: reviewBySubject.get(b.passenger.id) ?? null,
        })),
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

        if (!updatedRide) {
            // Race: ride was soft-deleted between the existence check and
            // the update. Roll back to keep status history consistent.
            throw new RideError(RideErrorCodes.RideNotFoundOrNotOwner);
        }

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
