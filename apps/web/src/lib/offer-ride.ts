import type { CreateRideBody } from "../api-client/model/createRideBody";
import type { LocationSuggestion } from "../components/LocationAutocomplete";

// Pure helpers behind the offer-ride form. Kept out of the page component so
// they can be unit-tested and reused without dragging React in.

/** License plate as the API expects it: uppercased, alphanumerics only. */
export function normalizePlate(plate: string): string {
    return plate
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "");
}

/**
 * Combines a calendar date with an `HH:MM` time string into a single Date, or
 * returns null when either part is missing or the time is malformed.
 */
export function combineDateAndTime(
    date: Date | undefined,
    time: string
): Date | null {
    if (!date || !time) return null;

    const [hours, minutes] = time.split(":").map(Number);
    if (
        !Number.isInteger(hours) ||
        !Number.isInteger(minutes) ||
        hours < 0 ||
        hours > 23 ||
        minutes < 0 ||
        minutes > 59
    ) {
        return null;
    }

    const result = new Date(date);
    result.setHours(hours, minutes, 0, 0);
    return result;
}

/** Parses a positive integer, or null when the input is not one. */
export function parsePositiveInteger(value: string): number | null {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isInteger(parsed) || parsed <= 0) {
        return null;
    }
    return parsed;
}

/** True when the string is empty or made up only of digits. */
export function isIntegerInput(value: string): boolean {
    return /^\d*$/.test(value);
}

/** Total trip-duration minutes from the free-text hour + minute inputs. */
export function parseDurationMinutes(hours: string, minutes: string): number {
    return (
        (Number.parseInt(hours, 10) || 0) * 60 +
        (Number.parseInt(minutes, 10) || 0)
    );
}

export type BuildRideBodyParams = {
    carId: string;
    rideDate: Date | undefined;
    rideTime: string;
    seats: string;
    price: string;
    pickupCity: LocationSuggestion | null;
    dropoffCity: LocationSuggestion | null;
    durationMinutes: number;
};

/**
 * Builds the `POST /rides` request body from the offer-ride form values, or
 * returns null when a required field is missing/invalid. Arrival is sent as an
 * absolute timestamp derived from the trip duration.
 */
export function buildCreateRideBody(
    params: BuildRideBodyParams
): CreateRideBody | null {
    const departureAt = combineDateAndTime(params.rideDate, params.rideTime);
    const offeredSeats = parsePositiveInteger(params.seats);
    const priceAmount = parsePositiveInteger(params.price);

    if (
        !params.carId ||
        !departureAt ||
        !params.pickupCity ||
        !params.dropoffCity ||
        !offeredSeats ||
        !priceAmount
    ) {
        return null;
    }

    const arrivalEstimateAt =
        params.durationMinutes > 0
            ? new Date(
                  departureAt.getTime() + params.durationMinutes * 60_000
              ).toISOString()
            : null;

    return {
        carId: params.carId,
        departureAt: departureAt.toISOString(),
        arrivalEstimateAt,
        offeredSeats,
        currency: "EUR",
        description: null,
        stops: [
            {
                address: params.pickupCity.address,
                city: params.pickupCity.city,
                countryCode: params.pickupCity.countryCode,
                lat: params.pickupCity.lat,
                lng: params.pickupCity.lng,
                plannedArrivalAt: null,
                plannedDepartureAt: departureAt.toISOString(),
            },
            {
                address: params.dropoffCity.address,
                city: params.dropoffCity.city,
                countryCode: params.dropoffCity.countryCode,
                lat: params.dropoffCity.lat,
                lng: params.dropoffCity.lng,
                plannedArrivalAt: null,
                plannedDepartureAt: null,
            },
        ],
        prices: [
            {
                startStopOrder: 0,
                endStopOrder: 1,
                amount: priceAmount,
                currency: "EUR",
            },
        ],
    };
}
