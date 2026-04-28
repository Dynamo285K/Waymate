import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/eden";
import { unwrap } from "../lib/eden-query";

export type PassengerBookingsTimeframe = "UPCOMING" | "PAST" | "ALL";

export type PassengerBooking = {
    id: string;
    bookingStatus:
        | "PENDING"
        | "CONFIRMED"
        | "COMPLETED"
        | "CANCELLED"
        | "REJECTED"
        | "NO_SHOW";
    priceAmount: number;
    currency: string;
    seatsLeft: number;
    pickupCity: string;
    dropoffCity: string;
    ride: {
        id: string;
        departureAt: string | Date;
        rideStatus: string;
    };
    driver: {
        id: string;
        firstName: string | null;
        lastName: string | null;
        profilePhotoUrl: string | null;
        averageRating: number | null;
        reviewCount: number;
    };
    myReviewOfDriver: { id: string; rating: number } | null;
};

export function usePassengerBookings(timeframe: PassengerBookingsTimeframe) {
    return useQuery<PassengerBooking[]>({
        queryKey: ["bookings", "me", timeframe],
        queryFn: () =>
            unwrap(
                api.bookings.me.get({
                    query: { timeframe },
                })
            ) as Promise<PassengerBooking[]>,
    });
}
