import { describe, expect, it } from "vitest";
import { mapBookingsToRides } from "./passenger-ride-view";
import type { PassengerBookingListItem } from "../../../../api-client/model/passengerBookingListItem";

function makeBooking(
    overrides: Partial<PassengerBookingListItem> = {}
): PassengerBookingListItem {
    return {
        id: "b1",
        bookingStatus: "CONFIRMED",
        priceAmount: 12,
        currency: "EUR",
        seatsLeft: 2,
        ride: {
            id: "r1",
            departureAt: "2026-01-01T08:00:00.000Z",
            arrivalEstimateAt: "2026-01-01T09:30:00.000Z",
            rideStatus: "PLANNED",
        },
        driver: {
            id: "d1",
            firstName: "Jane",
            lastName: "Doe",
            profilePhotoUrl: null,
            averageRating: 4.5,
            reviewCount: 10,
        },
        pickupCity: "Bratislava",
        dropoffCity: "Košice",
        requestedPickupCity: null,
        requestedDropoffCity: null,
        originalStartCity: "Bratislava",
        originalEndCity: "Košice",
        myReviewOfDriver: null,
        ...overrides,
    };
}

describe("mapBookingsToRides", () => {
    it("returns undefined when bookings are undefined", () => {
        expect(mapBookingsToRides(undefined)).toBeUndefined();
    });

    it("maps the core fields of a confirmed booking", () => {
        const [ride] = mapBookingsToRides([makeBooking()])!;
        expect(ride).toMatchObject({
            id: "b1",
            rideId: "r1",
            driverId: "d1",
            from: "Bratislava",
            to: "Košice",
            price: 12,
            seatsLeft: 2,
            status: "confirmed",
            driverName: "Jane Doe",
            driverRating: 4.5,
            duration: "1h 30min",
            alreadyReviewed: false,
        });
    });

    it("prefers the requested pickup/dropoff cities over the stop cities", () => {
        const [ride] = mapBookingsToRides([
            makeBooking({
                requestedPickupCity: "Trnava",
                requestedDropoffCity: "Žilina",
            }),
        ])!;
        expect(ride.from).toBe("Trnava");
        expect(ride.to).toBe("Žilina");
    });

    it("marks non-confirmed bookings as pending", () => {
        const [ride] = mapBookingsToRides([
            makeBooking({ bookingStatus: "PENDING" }),
        ])!;
        expect(ride.status).toBe("pending");
    });

    it("flags alreadyReviewed when a review of the driver exists", () => {
        const [ride] = mapBookingsToRides([
            makeBooking({ myReviewOfDriver: { id: "rev1", rating: 5 } }),
        ])!;
        expect(ride.alreadyReviewed).toBe(true);
    });

    it("falls back to 0 rating and trims a partially-named driver", () => {
        const [ride] = mapBookingsToRides([
            makeBooking({
                driver: {
                    id: "d2",
                    firstName: "Solo",
                    lastName: null,
                    profilePhotoUrl: null,
                    averageRating: null,
                    reviewCount: 0,
                },
            }),
        ])!;
        expect(ride.driverName).toBe("Solo");
        expect(ride.driverRating).toBe(0);
    });

    it("leaves duration undefined when there is no arrival estimate", () => {
        const [ride] = mapBookingsToRides([
            makeBooking({
                ride: {
                    id: "r1",
                    departureAt: "2026-01-01T08:00:00.000Z",
                    arrivalEstimateAt: null,
                    rideStatus: "PLANNED",
                },
            }),
        ])!;
        expect(ride.duration).toBeUndefined();
    });
});
