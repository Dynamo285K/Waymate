import { describe, expect, it } from "vitest";
import {
    buildCreateRideBody,
    combineDateAndTime,
    isIntegerInput,
    normalizePlate,
    parseDurationMinutes,
    parsePositiveInteger,
} from "./offer-ride";
import type { LocationSuggestion } from "../components/LocationAutocomplete";

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

describe("normalizePlate", () => {
    it("uppercases and strips non-alphanumerics", () => {
        expect(normalizePlate(" ba-123 ab ")).toBe("BA123AB");
    });

    it("returns an empty string when there are no alphanumerics", () => {
        expect(normalizePlate(" --- ")).toBe("");
    });
});

describe("combineDateAndTime", () => {
    it("merges a date with an HH:MM time", () => {
        const result = combineDateAndTime(new Date(2030, 0, 15), "08:30");
        expect(result?.getFullYear()).toBe(2030);
        expect(result?.getHours()).toBe(8);
        expect(result?.getMinutes()).toBe(30);
    });

    it("returns null when the date is missing", () => {
        expect(combineDateAndTime(undefined, "08:30")).toBeNull();
    });

    it("returns null when the time is missing", () => {
        expect(combineDateAndTime(new Date(2030, 0, 15), "")).toBeNull();
    });

    it("returns null for an out-of-range time", () => {
        expect(combineDateAndTime(new Date(2030, 0, 15), "25:00")).toBeNull();
    });

    it("returns null for a non-numeric time", () => {
        expect(combineDateAndTime(new Date(2030, 0, 15), "ab:cd")).toBeNull();
    });
});

describe("parsePositiveInteger", () => {
    it("parses a positive integer", () => {
        expect(parsePositiveInteger("3")).toBe(3);
    });

    it("rejects zero and negative numbers", () => {
        expect(parsePositiveInteger("0")).toBeNull();
        expect(parsePositiveInteger("-2")).toBeNull();
    });

    it("rejects empty and non-numeric input", () => {
        expect(parsePositiveInteger("")).toBeNull();
        expect(parsePositiveInteger("abc")).toBeNull();
    });
});

describe("isIntegerInput", () => {
    it("accepts empty and all-digit strings", () => {
        expect(isIntegerInput("")).toBe(true);
        expect(isIntegerInput("123")).toBe(true);
    });

    it("rejects strings containing non-digits", () => {
        expect(isIntegerInput("12a")).toBe(false);
        expect(isIntegerInput("-1")).toBe(false);
        expect(isIntegerInput("1.5")).toBe(false);
    });
});

describe("parseDurationMinutes", () => {
    it("combines hours and minutes", () => {
        expect(parseDurationMinutes("1", "30")).toBe(90);
    });

    it("treats blank parts as zero", () => {
        expect(parseDurationMinutes("", "")).toBe(0);
        expect(parseDurationMinutes("2", "")).toBe(120);
        expect(parseDurationMinutes("", "45")).toBe(45);
    });

    it("treats non-numeric parts as zero", () => {
        expect(parseDurationMinutes("x", "y")).toBe(0);
    });
});

describe("buildCreateRideBody", () => {
    const base = {
        carId: "car-1",
        rideDate: new Date(2030, 5, 1),
        rideTime: "09:00",
        seats: "3",
        price: "12",
        pickupCity: bratislava,
        dropoffCity: kosice,
        durationMinutes: 240,
    };

    it("builds a request body from valid input", () => {
        const body = buildCreateRideBody(base);
        if (!body) throw new Error("expected a non-null body");

        expect(body.carId).toBe("car-1");
        expect(body.offeredSeats).toBe(3);
        expect(body.currency).toBe("EUR");
        expect(body.stops).toHaveLength(2);
        expect(body.stops[0].city).toBe(bratislava.city);
        expect(body.stops[0].lat).toBe(bratislava.lat);
        expect(body.stops[1].city).toBe(kosice.city);
        expect(body.stops[1].lat).toBe(kosice.lat);
        expect(body.prices?.[0]?.amount).toBe(12);
    });

    it("derives arrivalEstimateAt as departure + duration", () => {
        const body = buildCreateRideBody(base);
        if (!body || body.arrivalEstimateAt == null) {
            throw new Error("expected a body with arrivalEstimateAt");
        }

        const gap =
            new Date(body.arrivalEstimateAt).getTime() -
            new Date(body.departureAt).getTime();
        expect(gap).toBe(240 * 60_000);
    });

    it("leaves arrivalEstimateAt null when there is no duration", () => {
        const body = buildCreateRideBody({ ...base, durationMinutes: 0 });
        expect(body?.arrivalEstimateAt).toBeNull();
    });

    it("returns null when a required field is missing or invalid", () => {
        expect(buildCreateRideBody({ ...base, carId: "" })).toBeNull();
        expect(buildCreateRideBody({ ...base, pickupCity: null })).toBeNull();
        expect(buildCreateRideBody({ ...base, seats: "0" })).toBeNull();
        expect(buildCreateRideBody({ ...base, rideTime: "bad" })).toBeNull();
    });
});
