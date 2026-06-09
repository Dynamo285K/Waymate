import { useGetRidesSearch } from "../../api-client/rides/rides";

type UseRideSearchParams = {
    startLat: number | null;
    startLng: number | null;
    startCity?: string | null;
    destLat: number | null;
    destLng: number | null;
    destCity?: string | null;
    date: string | null;
};

function parseTravelDate(date: string | null): Date | null {
    if (!date) return null;
    const parsed = new Date(date);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function useRideSearch({
    startLat,
    startLng,
    startCity,
    destLat,
    destLng,
    destCity,
    date,
}: UseRideSearchParams) {
    const travelDate = parseTravelDate(date);
    const canSearch =
        startLat !== null &&
        startLng !== null &&
        destLat !== null &&
        destLng !== null &&
        !!travelDate;

    const query = useGetRidesSearch(
        {
            // Typy z backendu ocakavaju cisla, ale fallback na 0 je v poriadku, kedze
            // `enabled: canSearch` zabrani odoslaniu neplatnej poziadavky, kym sa neziska presna lokacia.
            startLat: startLat ?? 0,
            startLng: startLng ?? 0,
            startCity: startCity ?? undefined,
            destLat: destLat ?? 0,
            destLng: destLng ?? 0,
            destCity: destCity ?? undefined,
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
