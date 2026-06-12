import { useEffect } from "react";
import { usePostRidesEstimateEta } from "../../../../api-client/rides/rides";
import type { LocationSuggestion } from "../../../../components/shared/LocationAutocomplete";
import { useDebounced } from "../../../../hooks/shared/useDebounced";
import { combineDateAndTime } from "../lib/offer-ride";

const ETA_DEBOUNCE_MS = 500;

export type EtaPreview = {
    arrivalEstimateAt: Date | null;
    isLoading: boolean;
    isError: boolean;
};

export type UseEtaPreviewParams = {
    pickupCity: LocationSuggestion | null;
    dropoffCity: LocationSuggestion | null;
    rideDate: Date | undefined;
    rideTime: string;
};

/**
 * Live OSRM-based ETA preview for the offer-ride form. Debounces the
 * route/departure inputs and re-fetches `/rides/estimate-eta` whenever they
 * settle, returning the dropoff stop's planned arrival time.
 */
export function useEtaPreview({
    pickupCity,
    dropoffCity,
    rideDate,
    rideTime,
}: UseEtaPreviewParams): EtaPreview {
    const departureAt = combineDateAndTime(rideDate, rideTime);

    const debouncedPickup = useDebounced(pickupCity, ETA_DEBOUNCE_MS);
    const debouncedDropoff = useDebounced(dropoffCity, ETA_DEBOUNCE_MS);
    const debouncedDepartureAtMs = useDebounced(
        departureAt ? departureAt.getTime() : null,
        ETA_DEBOUNCE_MS
    );

    const estimateEta = usePostRidesEstimateEta();
    const { mutate } = estimateEta;

    useEffect(() => {
        if (
            !debouncedPickup ||
            !debouncedDropoff ||
            debouncedDepartureAtMs === null
        ) {
            return;
        }

        mutate({
            data: {
                departureAt: new Date(debouncedDepartureAtMs).toISOString(),
                stops: [
                    { lat: debouncedPickup.lat, lng: debouncedPickup.lng },
                    { lat: debouncedDropoff.lat, lng: debouncedDropoff.lng },
                ],
            },
        });
    }, [debouncedPickup, debouncedDropoff, debouncedDepartureAtMs, mutate]);

    if (
        !debouncedPickup ||
        !debouncedDropoff ||
        debouncedDepartureAtMs === null
    ) {
        return { arrivalEstimateAt: null, isLoading: false, isError: false };
    }

    const dropoffEta = estimateEta.data?.at(-1);

    return {
        arrivalEstimateAt: dropoffEta
            ? new Date(dropoffEta.plannedArrivalAt)
            : null,
        isLoading: estimateEta.isPending,
        isError: estimateEta.isError,
    };
}
