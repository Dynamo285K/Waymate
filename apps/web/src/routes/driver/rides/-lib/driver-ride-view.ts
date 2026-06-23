import type { RideListItem } from "../../../../api-client/model/rideListItem";
import { formatDuration } from "../../../../lib/date-format";

// View model for the driver "My rides" cards.
export type DriverDisplayedRide = {
    id: string;
    from: string;
    to: string;
    date: string;
    price: number;
    seatsLeft: number | "full";
    rideStatus: RideListItem["rideStatus"];
    duration: string | undefined;
};

/**
 * Maps `GET /rides/me` rows to the card view model: origin/destination from the
 * ordered stops, remaining seats after confirmed bookings, the first segment
 * price, and a formatted trip duration.
 */
export function mapRidesToDisplayed(
    rides: RideListItem[] | undefined
): DriverDisplayedRide[] {
    return (
        rides?.map((ride) => {
            const sortedStops = [...ride.rideStops].sort(
                (a, b) => a.stopOrder - b.stopOrder
            );
            const from = sortedStops[0]?.city ?? "";
            const to = sortedStops[sortedStops.length - 1]?.city ?? "";
            const confirmedSeats = ride.bookings.reduce(
                (sum, booking) => sum + booking.seatCount,
                0
            );
            const remainingSeats = ride.offeredSeats - confirmedSeats;
            const seatsLeft: number | "full" =
                remainingSeats > 0 ? remainingSeats : "full";
            const price = ride.prices[0]?.amount ?? 0;

            return {
                id: ride.id,
                from,
                to,
                date: ride.departureAt,
                price,
                seatsLeft,
                rideStatus: ride.rideStatus,
                duration: formatDuration(
                    ride.departureAt,
                    ride.arrivalEstimateAt
                ),
            };
        }) ?? []
    );
}
