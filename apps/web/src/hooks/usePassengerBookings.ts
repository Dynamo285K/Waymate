import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/eden";
import { unwrap } from "../lib/eden-query";

export type PassengerBookingsTimeframe = "UPCOMING" | "PAST" | "ALL";

export function usePassengerBookings(timeframe: PassengerBookingsTimeframe) {
    return useQuery({
        queryKey: ["bookings", "me", timeframe],
        queryFn: () =>
            unwrap(
                api.bookings.me.get({
                    query: { timeframe },
                })
            ),
    });
}
