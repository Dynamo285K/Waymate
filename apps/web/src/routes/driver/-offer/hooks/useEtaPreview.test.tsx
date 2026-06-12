import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import type { LocationSuggestion } from "../../../../components/shared/LocationAutocomplete";
import { combineDateAndTime } from "../lib/offer-ride";

const { mockUsePostRidesEstimateEta, mockMutate } = vi.hoisted(() => ({
    mockUsePostRidesEstimateEta: vi.fn(),
    mockMutate: vi.fn(),
}));

vi.mock("../../../../api-client/rides/rides", () => ({
    usePostRidesEstimateEta: mockUsePostRidesEstimateEta,
}));

import { useEtaPreview, type UseEtaPreviewParams } from "./useEtaPreview";

const bratislava: LocationSuggestion = {
    id: "11111111-1111-1111-1111-111111111111",
    address: "Bratislava",
    city: "Bratislava",
    countryCode: "SK",
    lat: 48.1486,
    lng: 17.1077,
    score: 0,
};

const kosice: LocationSuggestion = {
    id: "22222222-2222-2222-2222-222222222222",
    address: "Košice",
    city: "Košice",
    countryCode: "SK",
    lat: 48.7164,
    lng: 21.2611,
    score: 0,
};

const emptyParams: UseEtaPreviewParams = {
    pickupCity: null,
    dropoffCity: null,
    rideDate: undefined,
    rideTime: "",
};

describe("useEtaPreview", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        mockMutate.mockReset();
        mockUsePostRidesEstimateEta.mockReturnValue({
            mutate: mockMutate,
            data: undefined,
            isPending: false,
            isError: false,
        });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("returns nulls and does not call the API when the route is incomplete", () => {
        const { result } = renderHook(() => useEtaPreview(emptyParams));

        expect(result.current).toEqual({
            arrivalEstimateAt: null,
            isLoading: false,
            isError: false,
        });
        expect(mockMutate).not.toHaveBeenCalled();
    });

    it("debounces and calls the ETA mutation with the route and departure time", () => {
        const rideDate = new Date(2030, 5, 1);
        const { rerender } = renderHook((props) => useEtaPreview(props), {
            initialProps: emptyParams,
        });

        rerender({
            pickupCity: bratislava,
            dropoffCity: kosice,
            rideDate,
            rideTime: "09:00",
        });

        expect(mockMutate).not.toHaveBeenCalled();

        act(() => {
            vi.advanceTimersByTime(500);
        });

        expect(mockMutate).toHaveBeenCalledTimes(1);
        const [{ data }] = mockMutate.mock.calls[0];
        expect(data.stops).toEqual([
            { lat: bratislava.lat, lng: bratislava.lng },
            { lat: kosice.lat, lng: kosice.lng },
        ]);
        expect(data.departureAt).toBe(
            combineDateAndTime(rideDate, "09:00")?.toISOString()
        );
    });

    it("surfaces the dropoff stop's planned arrival time from the response", () => {
        mockUsePostRidesEstimateEta.mockReturnValue({
            mutate: mockMutate,
            data: [
                {
                    lat: bratislava.lat,
                    lng: bratislava.lng,
                    plannedArrivalAt: "2030-06-01T09:00:00.000Z",
                },
                {
                    lat: kosice.lat,
                    lng: kosice.lng,
                    plannedArrivalAt: "2030-06-01T13:00:00.000Z",
                },
            ],
            isPending: false,
            isError: false,
        });

        const { result } = renderHook(() =>
            useEtaPreview({
                pickupCity: bratislava,
                dropoffCity: kosice,
                rideDate: new Date(2030, 5, 1),
                rideTime: "09:00",
            })
        );

        expect(result.current.arrivalEstimateAt).toEqual(
            new Date("2030-06-01T13:00:00.000Z")
        );
        expect(result.current.isLoading).toBe(false);
        expect(result.current.isError).toBe(false);
    });
});
