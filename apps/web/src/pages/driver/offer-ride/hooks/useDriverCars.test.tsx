import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";

// useDriverCars' only data source is the saved-cars query — mock it so the
// test fully controls when (and whether) the async list resolves.
const { mockUseGetCarsMe } = vi.hoisted(() => ({
    mockUseGetCarsMe: vi.fn(),
}));

vi.mock("../api-client/cars/cars", () => ({
    useGetCarsMe: mockUseGetCarsMe,
}));

import { useDriverCars } from "./useDriverCars";

const emptyManualEntry = {
    manualBrand: "",
    manualModel: "",
    manualPlate: "",
};

const car = (id: string) => ({
    id,
    brand: "Škoda",
    modelName: "Fabia",
    spz: `BA${id}`,
});

describe("useDriverCars", () => {
    beforeEach(() => {
        mockUseGetCarsMe.mockReset();
    });

    it("starts in manual mode with no cars", () => {
        mockUseGetCarsMe.mockReturnValue({ data: undefined });

        const { result } = renderHook(() => useDriverCars(emptyManualEntry));

        expect(result.current.driverCars).toEqual([]);
        expect(result.current.carMode).toBe("manual");
        expect(result.current.selectedCarId).toBe("");
    });

    it("auto-selects the first car once the saved list resolves", () => {
        mockUseGetCarsMe.mockReturnValue({ data: undefined });
        const { result, rerender } = renderHook(() =>
            useDriverCars(emptyManualEntry)
        );
        expect(result.current.selectedCarId).toBe("");

        mockUseGetCarsMe.mockReturnValue({ data: [car("1"), car("2")] });
        rerender();

        expect(result.current.driverCars).toHaveLength(2);
        expect(result.current.selectedCarId).toBe("1");
    });

    it("falls back to manual mode when the car list empties", () => {
        mockUseGetCarsMe.mockReturnValue({ data: undefined });
        const { result, rerender } = renderHook(() =>
            useDriverCars(emptyManualEntry)
        );

        mockUseGetCarsMe.mockReturnValue({ data: [car("1")] });
        rerender();
        act(() => result.current.selectCarMode("saved"));
        expect(result.current.carMode).toBe("saved");

        mockUseGetCarsMe.mockReturnValue({ data: [] });
        rerender();

        expect(result.current.carMode).toBe("manual");
        expect(result.current.selectedCarId).toBe("");
    });

    it("selectCarMode switches the active mode", () => {
        mockUseGetCarsMe.mockReturnValue({ data: undefined });
        const { result } = renderHook(() => useDriverCars(emptyManualEntry));

        act(() => result.current.selectCarMode("saved"));

        expect(result.current.carMode).toBe("saved");
    });

    it("addLocalCar appends a car created during this session", () => {
        mockUseGetCarsMe.mockReturnValue({ data: undefined });
        const { result } = renderHook(() => useDriverCars(emptyManualEntry));

        act(() =>
            result.current.addLocalCar({
                id: "local-1",
                brand: "VW",
                model: "Golf",
                plate: "BA999XX",
            })
        );

        expect(result.current.driverCars).toEqual([
            { id: "local-1", brand: "VW", model: "Golf", plate: "BA999XX" },
        ]);
    });
});
