import { useTranslation } from "react-i18next";
import { useGetRidesMe } from "../../../api-client/rides/rides";
import { useDriverRideRequests } from "./useDriverRideRequests";
import { formatDuration } from "../../../lib/date-format";

// View models the driver home page renders directly — kept here so the page
// component stays presentational and the slice/sort/transform logic lives in
// one testable place. The `upcomingRides` shape is also forwarded to
// /driver/rides/passengers via router state, so changing it affects that route.
export type DriverUpcomingRide = {
    id: string;
    from: string;
    to: string;
    date: Date;
    price: number;
    seatsLeft: number | "full";
    rideStatus: string;
    // formatDuration returns undefined when arrival ETA is missing/invalid.
    duration: string | undefined;
};

export type DriverRequestViewModel = {
    id: string;
    name: string;
    rating: number;
    seatsRequired: number;
    price: number;
    currency: string;
    from: string;
    to: string;
    date: Date;
};

type QueryMeta = {
    isLoading: boolean;
    isError: boolean;
    error: unknown;
};

export type DriverDashboardData = {
    upcomingRides: DriverUpcomingRide[];
    requests: DriverRequestViewModel[];
    ridesQuery: QueryMeta;
    requestsQuery: QueryMeta;
};

// Only the first 3 of each list are shown on the home dashboard; the full
// lists live on /driver/rides and /driver/requests.
const HOME_PREVIEW_COUNT = 3;

export function useDriverDashboardData(): DriverDashboardData {
    const { t } = useTranslation();

    const {
        data: rides,
        isLoading: areRidesLoading,
        isError: areRidesError,
        error: ridesError,
    } = useGetRidesMe({ timeframe: "UPCOMING" });

    const {
        data: rideRequests,
        isLoading: areRequestsLoading,
        isError: areRequestsError,
        error: requestsError,
    } = useDriverRideRequests();

    const upcomingRides: DriverUpcomingRide[] = (
        rides?.slice(0, HOME_PREVIEW_COUNT) ?? []
    ).map((ride) => {
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
            date: new Date(ride.departureAt),
            price: ride.prices[0]?.amount ?? 0,
            seatsLeft: remainingSeats > 0 ? remainingSeats : ("full" as const),
            rideStatus: ride.rideStatus,
            duration: formatDuration(ride.departureAt, ride.arrivalEstimateAt),
        };
    });

    const requests: DriverRequestViewModel[] = (
        rideRequests?.slice(0, HOME_PREVIEW_COUNT) ?? []
    ).map((request) => {
        const fullName = [
            request.passenger.firstName,
            request.passenger.lastName,
        ]
            .filter(Boolean)
            .join(" ");

        return {
            id: request.id,
            name: fullName || t("rideRequests.passenger"),
            rating: request.passenger.averageRating ?? 0,
            seatsRequired: request.seatCount,
            price: request.priceAmount,
            currency: request.currency,
            from: request.requestedPickupCity ?? request.pickupCity,
            to: request.requestedDropoffCity ?? request.dropoffCity,
            date: new Date(request.departureAt),
        };
    });

    return {
        upcomingRides,
        requests,
        ridesQuery: {
            isLoading: areRidesLoading,
            isError: areRidesError,
            error: ridesError,
        },
        requestsQuery: {
            isLoading: areRequestsLoading,
            isError: areRequestsError,
            error: requestsError,
        },
    };
}
