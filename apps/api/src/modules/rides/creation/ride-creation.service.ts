import { db } from "../../../db";
import { RideRepository } from "../ride.repository";
import { fetchOsrmRouteCells } from "../eta/osrm.service";
import { RideError, RideErrorCodes } from "../ride.errors";
import { calculateEtasFromDurations } from "../eta/ride-eta.service";
import * as h3 from "h3-js";
import type { CreateRideBody, CountryCode } from "@repo/shared";
import type { CreateRideInput } from "../ride.types";

export const createRide = async (driverId: string, data: CreateRideBody) => {
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
