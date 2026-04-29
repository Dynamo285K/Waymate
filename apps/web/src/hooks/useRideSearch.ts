import { useGetRidesSearch } from "../api-client/rides/rides";

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

    const query = useGetRidesSearch(
        {
            startCity: from ?? "",
            destinationCity: to ?? "",
            travelDate: travelDate?.toISOString() ?? "",
        },
        {
            query: { enabled: canSearch },
        }
    );

    return {
        ...query,
        canSearch,
    };
}
