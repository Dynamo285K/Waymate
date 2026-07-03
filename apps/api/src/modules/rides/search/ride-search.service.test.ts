import { describe, it, expect } from "vitest";
import { nearestStopWithin } from "./ride-search.service";

// Real coordinates of a short ride whose two stops are ~6 km apart — both fall
// inside the 25 km search radius of EITHER endpoint, which is exactly the
// case where the old first-match logic resolved the dropoff to the origin
// stop and the resulting booking was rejected as BOOKING_INVALID_STOPS.
const nachod = { id: "s0", stopOrder: 0, lat: 50.4031835, lng: 16.1470607 };
const velkePorici = {
    id: "s1",
    stopOrder: 1,
    lat: 50.4524878,
    lng: 16.1945859,
};
const stops = [nachod, velkePorici];

describe("nearestStopWithin", () => {
    it("picks the nearest stop, not the first, when several are in radius", () => {
        // Searching for the destination end must land on the destination stop
        // even though the origin stop is also within 25 km.
        expect(
            nearestStopWithin(velkePorici.lat, velkePorici.lng, stops)?.id
        ).toBe("s1");
        expect(nearestStopWithin(nachod.lat, nachod.lng, stops)?.id).toBe("s0");
    });

    it("returns null when no stop is within the radius", () => {
        // Prague is ~120 km from both stops.
        expect(nearestStopWithin(50.0755, 14.4378, stops)).toBeNull();
    });
});
