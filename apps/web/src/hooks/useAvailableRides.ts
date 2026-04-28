import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/eden";
import { unwrap } from "../lib/eden-query";

export function useAvailableRides() {
    return useQuery({
        queryKey: ["rides", "available"],
        queryFn: () => unwrap(api.rides.available.get()),
    });
}
