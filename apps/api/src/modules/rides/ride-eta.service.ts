import { fetchOsrmRouteCells } from "./osrm.service";

export const calculateEtasFromDurations = (
    departureAt: Date,
    stops: { lat: number; lng: number }[],
    durations: number[]
) => {
    let currentMs = departureAt.getTime();

    return stops.map((stop, index) => {
        if (index > 0) {
            currentMs += (durations[index - 1] || 0) * 1000;
        }

        // Zaokrúhlenie na najbližšiu celú minútu (60000 ms)
        const roundedMs = Math.round(currentMs / 60000) * 60000;

        return {
            ...stop,
            plannedArrivalAt: new Date(roundedMs),
            plannedDepartureAt: new Date(roundedMs),
        };
    });
};

export const estimateEtasForStops = async (
    departureAt: Date,
    stops: { lat: number; lng: number }[]
) => {
    const { durations } = await fetchOsrmRouteCells(stops);
    return calculateEtasFromDurations(departureAt, stops, durations);
};

export const haversineKm = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};
