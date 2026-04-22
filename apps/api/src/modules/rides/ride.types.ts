import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { rides } from "../../db/schema/ride";
import { rideStops } from "../../db/schema/ride_stop";
import { prices } from "../../db/schema/price";
import { rideStatusHistory } from "../../db/schema/ride_status_history";
import { CountryCode } from "../../shared";
import { bookingStatusValues } from "../../shared/status-values";
import { Car } from "../cars";
import { User } from "../users";

// ==========================================
// 1. BASE DATABASE TYPES (SELECT - what the DB returns)
// These replace z.infer<typeof RideSchema> etc.
// ==========================================
export type Ride = InferSelectModel<typeof rides>;
export type RideStop = InferSelectModel<typeof rideStops>;
export type Price = InferSelectModel<typeof prices>;
export type RideStatusHistory = InferSelectModel<typeof rideStatusHistory>;

// ==========================================
// 2. DATABASE TYPES FOR INSERTION (INSERT)
// These contain optional fields for id, createdAt, etc.
// ==========================================
export type RideInsert = InferInsertModel<typeof rides>;
export type RideStopInsert = InferInsertModel<typeof rideStops>;
export type PriceInsert = InferInsertModel<typeof prices>;
export type RideStatusHistoryInsert = InferInsertModel<
    typeof rideStatusHistory
>;

// ==========================================
// 3. SPECIFIC PROPERTIES AND ALIASES
// ==========================================
export type RideStatus = Ride["rideStatus"];
export type BookingStatus = (typeof bookingStatusValues)[number];
// ==========================================
// 4. SERVICE / REPOSITORY CONTRACTS (COMPOSITE TYPES)
// ==========================================

export type PublicDriverProfile = Pick<
    User,
    "id" | "firstName" | "lastName" | "profilePhotoUrl"
>;
export type PublicCarProfile = Pick<Car, "id" | "modelId" | "color" | "spz">;

export type RideListItem = Ride & {
    rideStops: Pick<RideStop, "city" | "stopOrder">[];
    bookings: { id: string; seatCount: number }[];
    prices: Pick<Price, "amount" | "currency" | "startStopId" | "endStopId">[];
};

export type RideTimeframe = "UPCOMING" | "PAST" | "ALL";

export type RidePassengersHeader = Pick<
    Ride,
    "id" | "departureAt" | "rideStatus" | "offeredSeats" | "currency"
> & {
    rideStops: Pick<RideStop, "id" | "city" | "stopOrder">[];
};

export type RidePassengerItem = {
    bookingId: string;
    bookingStatus: BookingStatus;
    seatCount: number;
    passenger: Pick<User, "id" | "firstName" | "lastName" | "profilePhotoUrl">;
    pickupStop: Pick<RideStop, "id" | "city" | "stopOrder"> | null;
    dropoffStop: Pick<RideStop, "id" | "city" | "stopOrder"> | null;
};

export type RidePassengersView = {
    ride: RidePassengersHeader;
    passengerCount: number;
    passengers: RidePassengerItem[];
};

export type RideSearchResultItem = {
    rideId: string;
    departureAt: Date;
    rideStatus: RideStatus;
    offeredSeats: number;

    driver: PublicDriverProfile;

    pickupStop: {
        city: string;
        plannedDepartureAt: Date | null;
    };
    dropoffStop: {
        city: string;
        plannedArrivalAt: Date | null;
    };

    priceAmount: number | null;
    currency: string;
};

export type CreateRideInput = Pick<
    RideInsert,
    | "driverId"
    | "carId"
    | "departureAt"
    | "arrivalEstimateAt"
    | "rideStatus"
    | "offeredSeats"
    | "currency"
    | "description"
> & {
    stops: Array<{
        address: string;
        city: string;
        countryCode?: CountryCode | null;
        lat: number;
        lng: number;
        plannedArrivalAt?: Date | null;
        plannedDepartureAt?: Date | null;
    }>;
    prices?: Array<{
        startStopOrder: number;
        endStopOrder: number;
        amount: number;
        currency?: string;
    }>;
    changedByUserId?: string | null;
    reason?: string | null;
};

export type PassengerRideListItem = {
    bookingId: string;
    bookingStatus: BookingStatus;
    seatCount: number;
    priceAmount: number;
    currency: string;

    ride: {
        id: string;
        departureAt: Date;
        rideStatus: RideStatus;
    };

    driver: PublicDriverProfile; // Zoberie to id, firstName, lastName, profilePhotoUrl

    pickupCity: string;
    dropoffCity: string;
};
