import { db } from "../../db";
import { RideRepository } from "./ride.repository";
import { fetchOsrmRouteCells } from "./osrm.service";
import { RideError, RideErrorCodes } from "./ride.errors";
import { REVIEW_WINDOW_DAYS } from "../reviews/review.service";
import * as h3 from "h3-js";
import type {
    CreateRideBody,
    SearchRidesQuery,
    CountryCode,
} from "@repo/shared";
import type {
    CreateRideInput,
    EndRideInput,
    RidePassengersView,
    RideSearchResultItem,
    RideTimeframe,
} from "./ride.types";

const getAvailableRides = async (viewerId?: string) => {
    return await RideRepository.findAvailableRides(db, viewerId);
};

const POPULAR_ROUTES_LIMIT = 4;

const getPopularRoutes = async () => {
    return await RideRepository.findPopularRoutes(db, POPULAR_ROUTES_LIMIT);
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
    const [driverReviews, passengerRatings] = await Promise.all([
        RideRepository.findReviewsByAuthorForSubjects(
            db,
            rideId,
            driverId,
            passengerIds
        ),
        RideRepository.findAverageRatingsByUserIds(db, passengerIds),
    ]);
    const reviewBySubject = new Map(
        driverReviews.map((r) => [r.subjectId, { id: r.id, rating: r.rating }])
    );
    const ratingByPassenger = new Map(
        passengerRatings.map((r) => [r.subjectId, r.averageRating])
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
            priceAmount: b.priceAmount,
            currency: b.currency,
            requestedPickupCity: b.requestedPickupCity,
            requestedDropoffCity: b.requestedDropoffCity,
            passenger: {
                ...b.passenger,
                averageRating: ratingByPassenger.get(b.passenger.id) ?? null,
                reviewCount: 0,
            },
            pickupStop: b.pickupStop,
            dropoffStop: b.dropoffStop,
            myReviewOfPassenger: reviewBySubject.get(b.passenger.id) ?? null,
        })),
    };
};

const searchRides = async (query: SearchRidesQuery, viewerId?: string) => {
    const { startLat, startLng, destLat, destLng } = query;

    const rawResults = await RideRepository.searchRides(
        db,
        startLat,
        startLng,
        destLat,
        destLng,
        query.travelDate,
        query.startCity ?? "Dynamic Location",
        query.destCity || "Dynamic Location",
        viewerId
    );

    const uniqueRides = new Map<
        string,
        RideSearchResultItem & { _totalDist: number }
    >();
    for (const row of rawResults) {
        const totalDist =
            (row.pickupStop.distanceKm || 0) +
            (row.dropoffStop.distanceKm || 0);
        const existing = uniqueRides.get(row.rideId);
        if (!existing || totalDist < existing._totalDist) {
            uniqueRides.set(row.rideId, { ...row, _totalDist: totalDist });
        }
    }

    const finalRides = Array.from(uniqueRides.values()).map(
        ({ _totalDist, ...cleanRide }) => cleanRide
    );

    if (finalRides.length === 0) return [];

    const rideIds = finalRides.map((r) => r.rideId);
    const [allStops, allPrices] = await Promise.all([
        RideRepository.findStopsForRides(db, rideIds),
        RideRepository.findPricesForRides(db, rideIds),
    ]);

    const validFinalRides: RideSearchResultItem[] = [];

    for (const ride of finalRides) {
        const stopsForRide = allStops.filter((s) => s.rideId === ride.rideId);

        let actualPickupStop = null;
        let actualDropoffStop = null;

        for (const stop of stopsForRide) {
            if (haversineKm(startLat, startLng, stop.lat, stop.lng) <= 25) {
                actualPickupStop = stop;
                break;
            }
        }

        for (const stop of stopsForRide) {
            if (haversineKm(destLat, destLng, stop.lat, stop.lng) <= 25) {
                actualDropoffStop = stop;
                break;
            }
        }

        if (actualPickupStop) {
            ride.pickupStop.pickupStopId = actualPickupStop.id;
            ride.pickupStop.isDynamic = false;
            ride.pickupStop.city = actualPickupStop.city;
            ride.pickupStop.lat = actualPickupStop.lat;
            ride.pickupStop.lng = actualPickupStop.lng;
            ride.pickupStop.plannedDepartureAt =
                actualPickupStop.plannedDepartureAt ||
                ride.pickupStop.plannedDepartureAt;
            ride.pickupStop.distanceKm = Number(
                haversineKm(
                    startLat,
                    startLng,
                    actualPickupStop.lat,
                    actualPickupStop.lng
                ).toFixed(1)
            );
        }

        if (actualDropoffStop) {
            ride.dropoffStop.dropoffStopId = actualDropoffStop.id;
            ride.dropoffStop.isDynamic = false;
            ride.dropoffStop.city = actualDropoffStop.city;
            ride.dropoffStop.lat = actualDropoffStop.lat;
            ride.dropoffStop.lng = actualDropoffStop.lng;
            ride.dropoffStop.plannedArrivalAt =
                actualDropoffStop.plannedArrivalAt ||
                ride.dropoffStop.plannedArrivalAt;
            ride.dropoffStop.distanceKm = Number(
                haversineKm(
                    destLat,
                    destLng,
                    actualDropoffStop.lat,
                    actualDropoffStop.lng
                ).toFixed(1)
            );
        }

        if (actualPickupStop && actualDropoffStop) {
            if (actualPickupStop.stopOrder > actualDropoffStop.stopOrder) {
                continue;
            }

            const exactPrice = allPrices.find(
                (p) =>
                    p.rideId === ride.rideId &&
                    p.startStopId === actualPickupStop.id &&
                    p.endStopId === actualDropoffStop.id
            );
            if (exactPrice) {
                ride.priceAmount = exactPrice.amount;
            }
        }

        validFinalRides.push(ride);
    }

    return validFinalRides;
};

export const calculateEtasFromDurations = (
    departureAt: Date,
    stops: { lat: number; lng: number }[],
    durations: number[]
) => {
    let currentMs = departureAt.getTime();

    return stops.map((stop, index) => {
        if (index > 0) {
            currentMs += (durations[index - 1] || 0) * 1000;
        }

        // Zaokrúhlenie na najbližšiu celú minútu (60000 ms)
        const roundedMs = Math.round(currentMs / 60000) * 60000;

        return {
            ...stop,
            plannedArrivalAt: new Date(roundedMs),
            plannedDepartureAt: new Date(roundedMs),
        };
    });
};

export const estimateEtasForStops = async (
    departureAt: Date,
    stops: { lat: number; lng: number }[]
) => {
    const { durations } = await fetchOsrmRouteCells(stops);
    return calculateEtasFromDurations(departureAt, stops, durations);
};

const createRide = async (driverId: string, data: CreateRideBody) => {
    // Fetched once up front: the H3 route cells (for ride_route_cells) and the
    // leg durations (fallback for arrivalEstimateAt below) come from the same
    // OSRM call, and arrivalEstimateAt must be known before insertRide.
    const { cells: osrmCells, durations: osrmDurations } =
        await fetchOsrmRouteCells(data.stops);

    const input: CreateRideInput = {
        ...data,
        // The ride always stores an absolute arrival timestamp; when the
        // client expresses arrival as a duration, or sends neither, resolve
        // it here so nothing downstream has to know that.
        arrivalEstimateAt: resolveArrivalEstimateAt(data, osrmDurations),
        driverId,
        rideStatus: "PLANNED",
    };
    const autoEndAt = computeAutoEndAt(input);

    return await db.transaction(async (tx) => {
        const car = await RideRepository.findActiveCarForDriver(
            tx,
            input.carId,
            input.driverId
        );

        if (!car) {
            throw new RideError(RideErrorCodes.CarNotAvailableForDriver);
        }

        // A ride can't offer more seats than the chosen car physically has.
        // Without this, the booking-capacity math downstream trusts a number
        // that was never validated against the vehicle.
        if (input.offeredSeats > car.seatsTotal) {
            throw new RideError(RideErrorCodes.TooManySeats);
        }

        const safeArrivalEstimateAt =
            input.arrivalEstimateAt ||
            new Date(input.departureAt.getTime() + 24 * 60 * 60 * 1000);

        const overlappingRides =
            await RideRepository.findOverlappingRidesForDriver(
                tx,
                input.driverId,
                input.departureAt,
                safeArrivalEstimateAt
            );

        if (overlappingRides.length > 0) {
            throw new RideError(RideErrorCodes.DriverAlreadyHasRideInTimeframe);
        }

        const newRide = await RideRepository.insertRide(tx, {
            driverId: input.driverId,
            carId: input.carId,
            departureAt: input.departureAt,
            arrivalEstimateAt: input.arrivalEstimateAt,
            autoEndAt,
            rideStatus: input.rideStatus || "PLANNED",
            offeredSeats: input.offeredSeats,
            currency: input.currency,
            description: input.description,
        });

        const estimatedStops = calculateEtasFromDurations(
            input.departureAt,
            input.stops,
            osrmDurations
        );

        const stopsToInsert = input.stops.map((stop, index) => ({
            rideId: newRide.id,
            stopOrder: index,
            address: stop.address,
            city: stop.city,
            countryCode: stop.countryCode as CountryCode,
            h3Res7: h3.latLngToCell(stop.lat, stop.lng, 7),
            h3Res8: h3.latLngToCell(stop.lat, stop.lng, 8),
            lat: stop.lat,
            lng: stop.lng,
            plannedArrivalAt: estimatedStops[index].plannedArrivalAt,
            plannedDepartureAt: estimatedStops[index].plannedDepartureAt,
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

        if (osrmCells.length > 0) {
            const routeCellsToInsert = osrmCells.map((cell) => ({
                rideId: newRide.id,
                h3Res7: cell.h3Res7,
                lat: cell.lat,
                lng: cell.lng,
                pointOrder: cell.pointOrder,
            }));
            await RideRepository.insertRideRouteCells(tx, routeCellsToInsert);
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

// Arrival is supplied as a durationMinutes offset from departure (or, kept for
// flexibility, as an absolute arrivalEstimateAt). The schema guarantees at most
// one is set. When neither is sent, fall back to the OSRM leg durations fetched
// for the same stops, summed and rounded to the nearest minute the same way
// estimateEtasForStops derives a stop's plannedArrivalAt. Either way a ride
// stores an absolute timestamp — a duration is never persisted, it has no
// meaning without the departure anchor.
const resolveArrivalEstimateAt = (
    data: CreateRideBody,
    osrmDurations: number[]
): Date | null => {
    if (data.arrivalEstimateAt) return data.arrivalEstimateAt;
    if (data.durationMinutes != null) {
        return new Date(
            data.departureAt.getTime() + data.durationMinutes * 60_000
        );
    }
    if (osrmDurations.length === 0) return null;

    const totalDurationMs =
        osrmDurations.reduce((sum, leg) => sum + leg, 0) * 1000;
    const arrivalMs = data.departureAt.getTime() + totalDurationMs;
    return new Date(Math.round(arrivalMs / 60_000) * 60_000);
};

const AUTO_END_BUFFER_MS = 60 * 60 * 1000; // 1 hour after expected arrival

const computeAutoEndAt = (
    input: Pick<CreateRideInput, "arrivalEstimateAt" | "stops">
) => {
    const base =
        input.arrivalEstimateAt ??
        input.stops.at(-1)?.plannedArrivalAt ??
        input.stops.at(-1)?.plannedDepartureAt ??
        null;

    if (!base) return null;
    return new Date(base.getTime() + AUTO_END_BUFFER_MS);
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

const endRide = async (input: EndRideInput): Promise<string> => {
    const actorUserId = input.actorUserId ?? null;
    if (input.source !== "AUTO" && !actorUserId) {
        throw new RideError(RideErrorCodes.RideNotFoundOrNotOwner);
    }

    const endedAt = input.endedAt ?? new Date();
    const driverId = input.source === "DRIVER" ? actorUserId! : undefined;
    const endedByUserId = input.source === "AUTO" ? null : actorUserId;
    const endReason = input.reason || defaultEndReason(input.source);

    return await db.transaction(async (tx) => {
        const ride = await RideRepository.findRideForEnd(
            tx,
            input.rideId,
            driverId
        );

        if (!ride) {
            throw new RideError(RideErrorCodes.RideNotFoundOrNotOwner);
        }

        if (ride.rideStatus === "COMPLETED") {
            return ride.id;
        }

        if (
            ride.rideStatus !== "PLANNED" &&
            ride.rideStatus !== "IN_PROGRESS"
        ) {
            throw new RideError(RideErrorCodes.RideNotCompletable);
        }

        // Guard against marking a future ride complete — the review window and
        // "past rides" listing both assume a COMPLETED ride has actually run.
        if (ride.departureAt > endedAt) {
            throw new RideError(RideErrorCodes.RideNotDeparted);
        }

        const updatedRide = await RideRepository.updateRideToEnded(tx, {
            rideId: input.rideId,
            driverId,
            endedAt,
            endedByUserId,
            endSource: input.source,
            endReason,
            autoEndProcessedAt: input.source === "AUTO" ? endedAt : null,
        });

        if (!updatedRide) {
            const currentRide = await RideRepository.findRideForEnd(
                tx,
                input.rideId,
                driverId
            );

            if (currentRide?.rideStatus === "COMPLETED") {
                return currentRide.id;
            }

            if (currentRide) {
                throw new RideError(RideErrorCodes.RideNotCompletable);
            }

            throw new RideError(RideErrorCodes.RideNotFoundOrNotOwner);
        }

        await RideRepository.insertRideStatusHistory(tx, {
            rideId: updatedRide.id,
            oldStatus: ride.rideStatus,
            newStatus: "COMPLETED",
            changedByUserId: endedByUserId,
            reason: endReason,
        });

        // Carry confirmed bookings to COMPLETED so the rating window opens for
        // both sides and the passenger's "past rides" reflects reality. PENDING
        // requests are left untouched — they were never accepted.
        const confirmedBookings =
            await RideRepository.findConfirmedBookingsByRideId(
                tx,
                input.rideId
            );

        if (confirmedBookings.length > 0) {
            const bookingIds = confirmedBookings.map((b) => b.id);

            await RideRepository.bulkCompleteBookings(tx, bookingIds);

            await RideRepository.bulkInsertBookingStatusHistory(
                tx,
                confirmedBookings.map((b) => ({
                    bookingId: b.id,
                    oldStatus: b.bookingStatus,
                    newStatus: "COMPLETED" as const,
                    changedByUserId: endedByUserId,
                    reason: endReason,
                }))
            );
        }

        return updatedRide.id;
    });
};

const defaultEndReason = (source: EndRideInput["source"]) => {
    switch (source) {
        case "AUTO":
            return "Ride ended automatically";
        case "ADMIN":
            return "Ride ended by admin";
        case "DRIVER":
            return "Ride ended by driver";
    }
};

export const haversineKm = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

const completeRide = async (
    rideId: string,
    driverId: string,
    reason?: string
): Promise<string> => {
    return await endRide({
        rideId,
        actorUserId: driverId,
        source: "DRIVER",
        reason,
    });
};

const autoEndExpiredRides = async ({
    now = new Date(),
    limit,
}: {
    now?: Date;
    limit: number;
}): Promise<{
    candidates: number;
    processed: number;
    failed: number;
    failures: { rideId: string; error: string }[];
}> => {
    const dueRides = await RideRepository.findRidesDueForAutoEnd(
        db,
        now,
        limit
    );
    const failures: { rideId: string; error: string }[] = [];
    let processed = 0;

    for (const ride of dueRides) {
        try {
            await endRide({
                rideId: ride.id,
                source: "AUTO",
                endedAt: now,
            });
            processed += 1;
        } catch (error) {
            failures.push({
                rideId: ride.id,
                error:
                    error instanceof Error
                        ? error.message
                        : "Unknown auto-end error",
            });
        }
    }

    return {
        candidates: dueRides.length,
        processed,
        failed: failures.length,
        failures,
    };
};

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
