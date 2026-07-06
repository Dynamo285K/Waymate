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

const SEARCH_STOP_RADIUS_KM = 5;

type StopCandidate = {
    lat: number;
    lng: number;
    [key: string]: unknown;
};

// Exported for unit tests — the first-match variant of this helper caused
// search to resolve pickup and dropoff to the same stop on short rides.
export const nearestStopWithin = <T extends StopCandidate>(
    lat: number,
    lng: number,
    stops: T[]
): T | null => {
    let best: T | null = null;
    let bestDist = Infinity;
    for (const stop of stops) {
        const dist = haversineKm(lat, lng, stop.lat, stop.lng);
        if (dist <= SEARCH_STOP_RADIUS_KM && dist < bestDist) {
            best = stop;
            bestDist = dist;
        }
    }
    return best;
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

        // Match the NEAREST stop within the radius, not the first one found —
        // on rides whose stops are closer together than the 25 km radius (e.g.
        // Náchod → Velké Poříčí, 6 km apart), first-match resolved both the
        // pickup and the dropoff to stop 0 and the resulting booking payload
        // (pickup == dropoff) was rejected as BOOKING_INVALID_STOPS.
        let actualPickupStop = nearestStopWithin(
            startLat,
            startLng,
            stopsForRide
        );
        let actualDropoffStop = nearestStopWithin(
            destLat,
            destLng,
            stopsForRide
        );

        // If both ends snapped to the same explicit stop (can happen on short searches),
        // we revert the one that is further away back to a dynamic stop, so the passenger
        // can still book the ride (with one explicit and one dynamic stop).
        if (
            actualPickupStop &&
            actualDropoffStop &&
            actualPickupStop.id === actualDropoffStop.id
        ) {
            const startDist = haversineKm(
                startLat,
                startLng,
                actualPickupStop.lat,
                actualPickupStop.lng
            );
            const destDist = haversineKm(
                destLat,
                destLng,
                actualDropoffStop.lat,
                actualDropoffStop.lng
            );
            if (startDist < destDist) {
                actualDropoffStop = null;
            } else {
                actualPickupStop = null;
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
            // `>=`: a ride where both ends resolve to the SAME stop is not
            // bookable either (the API rejects pickup == dropoff).
            if (actualPickupStop.stopOrder >= actualDropoffStop.stopOrder) {
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
