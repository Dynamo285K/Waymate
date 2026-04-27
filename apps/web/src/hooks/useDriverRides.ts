import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/eden";
import { unwrap } from "../lib/eden-query";

export type DriverRidesTimeframe = "UPCOMING" | "PAST" | "ALL";

export function useDriverRides(timeframe: DriverRidesTimeframe) {
    return useQuery({
        queryKey: ["rides", "me", timeframe],
        queryFn: () =>
            unwrap(
                api.rides.me.get({
                    query: { timeframe },
                })
            ),
    });
}
