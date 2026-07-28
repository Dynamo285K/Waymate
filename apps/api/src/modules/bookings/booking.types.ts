import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import type { bookings } from "../../db/schema/booking";
import type { bookingStatusHistory } from "../../db/schema"; // Import rovnaký ako si mal v ride.repository.ts
import type { User } from "../users/user.types";
import type { Ride } from "../rides/ride.types";
import type { Car } from "../cars/car.types";

export type Booking = InferSelectModel<typeof bookings>;
export type BookingStatusHistory = InferSelectModel<
    typeof bookingStatusHistory
>;

export type BookingInsert = InferInsertModel<typeof bookings>;
export type BookingStatusHistoryInsert = InferInsertModel<
    typeof bookingStatusHistory
>;

export type BookingStatus = Booking["bookingStatus"];
export type BookingTimeframe = "UPCOMING" | "PAST" | "ALL";

// Data passed from the service layer to the repository when creating a booking.
// Price is resolved inside the repository transaction.
export type CreateBookingInput = Pick<
    BookingInsert,
    "rideId" | "passengerId" | "pickupStopId" | "dropoffStopId" | "seatCount"
> & {
    dynamicPickup?: { lat: number; lng: number; city: string };
    dynamicDropoff?: { lat: number; lng: number; city: string };
    priceAmount?: number;
    requestedPickupCity?: string;
    requestedDropoffCity?: string;
};

// Defines how a single booking appears in the passenger's "My rides" list.
export type PassengerBookingListItem = {
    id: string;
    bookingStatus: BookingStatus;
    priceAmount: number;
    currency: string;
    seatsLeft: number;
    ride: Pick<Ride, "id" | "departureAt" | "arrivalEstimateAt" | "rideStatus">;
    driver: Pick<User, "id" | "firstName" | "lastName" | "profilePhotoUrl"> & {
        averageRating: number | null;
        reviewCount: number;
    };
    pickupCity: string;
    dropoffCity: string;
    requestedPickupCity: string | null;
    requestedDropoffCity: string | null;
    originalStartCity: string;
    originalEndCity: string;
    myReviewOfDriver: { id: string; rating: number } | null;
};

// Raw row shape returned by the repository before service-level reshape.
export type PassengerBookingListRow = Omit<
    PassengerBookingListItem,
    "myReviewOfDriver"
> & {
    myReviewOfDriverId: string | null;
    myReviewOfDriverRating: number | null;
};

export type CoPassenger = Pick<
    User,
    "id" | "firstName" | "lastName" | "profilePhotoUrl"
>;

// Full detail behind the passenger's "View details" card — fetched on demand
// for a single booking, unlike the lighter PassengerBookingListItem rows.
export type PassengerBookingDetail = {
    id: string;
    bookingStatus: BookingStatus;
    priceAmount: number;
    currency: string;
    ride: Pick<
        Ride,
        "id" | "departureAt" | "arrivalEstimateAt" | "rideStatus" | "offeredSeats"
    >;
    driver: Pick<User, "id" | "firstName" | "lastName" | "profilePhotoUrl"> & {
        averageRating: number | null;
        reviewCount: number;
    };
    car: Pick<Car, "spz" | "color"> & { brand: string; modelName: string };
    pickupCity: string;
    dropoffCity: string;
    requestedPickupCity: string | null;
    requestedDropoffCity: string | null;
    originalStartCity: string;
    originalEndCity: string;
    coPassengers: CoPassenger[];
};

// Raw row shape returned by the repository — passengerId (for the service's
// ownership check) instead of coPassengers (fetched separately).
export type PassengerBookingDetailRow = Omit<
    PassengerBookingDetail,
    "coPassengers"
> & {
    passengerId: string;
};

export type DriverRideRequestItem = {
    id: string; // Booking ID used for confirm/reject operations
    rideId: string;
    seatCount: number;
    priceAmount: number;
    currency: string;
    passenger: Pick<
        User,
        "id" | "firstName" | "lastName" | "profilePhotoUrl"
    > & {
        averageRating: number | null;
    };
    pickupCity: string;
    dropoffCity: string;
    requestedPickupCity: string | null;
    requestedDropoffCity: string | null;
    originalStartCity: string;
    originalEndCity: string;
    departureAt: Date;
};
