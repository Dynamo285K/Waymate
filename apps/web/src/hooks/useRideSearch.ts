import { useGetRidesSearch } from "../api-client/rides/rides";

type UseRideSearchParams = {
    fromId: string | null;
    toId: string | null;
    date: string | null;
};

function parseTravelDate(date: string | null): Date | null {
    if (!date) return null;
    const parsed = new Date(date);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function useRideSearch({ fromId, toId, date }: UseRideSearchParams) {
    const travelDate = parseTravelDate(date);
    const canSearch = !!fromId && !!toId && !!travelDate;

    const query = useGetRidesSearch(
        {
            startCityId: fromId ?? "",
            destinationCityId: toId ?? "",
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
