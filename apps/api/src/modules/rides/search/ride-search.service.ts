import { db } from "../../../db";
import { RideRepository } from "../ride.repository";
import { haversineKm } from "../eta/ride-eta.service";
import type { SearchRidesQuery } from "@repo/shared";
import type { RideSearchResultItem } from "../ride.types";

export const getAvailableRides = async (viewerId?: string) => {
    return await RideRepository.findAvailableRides(db, viewerId);
};

const POPULAR_ROUTES_LIMIT = 4;

export const getPopularRoutes = async () => {
    return await RideRepository.findPopularRoutes(db, POPULAR_ROUTES_LIMIT);
};

export const searchRides = async (
    query: SearchRidesQuery,
    viewerId?: string
) => {
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
