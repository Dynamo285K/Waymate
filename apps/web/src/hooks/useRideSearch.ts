import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/eden";
import { unwrap } from "../lib/eden-query";

type UseRideSearchParams = {
    from: string | null;
    to: string | null;
    date: string | null;
};

function parseTravelDate(date: string | null): Date | null {
    if (!date) return null;

    const parsed = new Date(date);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function useRideSearch({ from, to, date }: UseRideSearchParams) {
    const travelDate = parseTravelDate(date);
    const canSearch = !!from && !!to && !!travelDate;

    const query = useQuery({
        queryKey: ["rides", "search", from, to, date],
        queryFn: () =>
            unwrap(
                api.rides.search.get({
                    query: {
                        startCity: from!,
                        destinationCity: to!,
                        travelDate: travelDate!,
                    },
                })
            ),
        enabled: canSearch,
    });

    return {
        ...query,
        canSearch,
    };
}
