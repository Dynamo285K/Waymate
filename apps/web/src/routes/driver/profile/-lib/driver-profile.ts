import type { RideListItem } from "../../../../api-client/model/rideListItem";
import type { Language } from "../../../../components/controls/LanguageSwitcher";
import { formatDuration } from "../../../../lib/date-format";

export type UpcomingRide = {
    id: string;
    from: string;
    to: string;
    date: string;
    price: number;
    seatsLeft: number | "full";
    duration: string | undefined;
};

/** Flattens the driver's upcoming rides into the view model RideCard expects. */
export function mapUpcomingRides(
    rides: RideListItem[] | undefined
): UpcomingRide[] {
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

            return {
                id: ride.id,
                from,
                to,
                date: ride.departureAt,
                price: ride.prices[0]?.amount ?? 0,
                seatsLeft:
                    remainingSeats > 0 ? remainingSeats : ("full" as const),
                duration: formatDuration(
                    ride.departureAt,
                    ride.arrivalEstimateAt
                ),
            };
        }) ?? []
    );
}

export function formatMemberSince(
    value: string | Date | undefined,
    language: Language
) {
    if (!value) return "";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    return new Intl.DateTimeFormat(language, {
        month: "long",
        year: "numeric",
    }).format(date);
}
