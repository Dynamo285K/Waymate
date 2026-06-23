import type { AvailableRideList } from "../api-client/model/availableRideList";
import { formatDuration } from "./date-format";

// Card view model for the public "available rides" listing on `/rides`.
export interface AvailableRideCardModel {
    id: string;
    from: string;
    to: string;
    date: Date;
    seatsLeft: number;
    duration?: string;
    driverName: string;
    driverRating: number;
    price: number;
}

/**
 * Maps `GET /rides/available` rows into the card view model. `driverFallback`
 * is shown when the driver has no name (kept as a parameter so the mapper stays
 * pure and translation-agnostic).
 */
export function mapAvailableRides(
    rows: AvailableRideList | undefined,
    driverFallback: string
): AvailableRideCardModel[] {
    if (!Array.isArray(rows)) return [];

    return rows.map((ride) => {
        const driverName = [ride.driver.firstName, ride.driver.lastName]
            .filter(Boolean)
            .join(" ");

        return {
            id: ride.rideId,
            from: ride.pickupStop.city,
            to: ride.dropoffStop.city,
            date: new Date(
                ride.pickupStop.plannedDepartureAt ?? ride.departureAt
            ),
            seatsLeft: ride.seatsLeft,
            duration: formatDuration(ride.departureAt, ride.arrivalEstimateAt),
            driverName: driverName || driverFallback,
            driverRating: ride.driver.averageRating ?? 0,
            price: ride.priceAmount ?? 0,
        };
    });
}
