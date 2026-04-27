import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/eden";
import { unwrap } from "../lib/eden-query";

export function useRidePassengers(rideId: string | undefined) {
    return useQuery({
        queryKey: ["rides", rideId, "passengers"],
        queryFn: () => unwrap(api.rides({ id: rideId! }).passengers.get()),
        enabled: !!rideId,
    });
}
