import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import type { bookings } from "../../db/schema/booking";
import type { bookingStatusHistory } from "../../db/schema"; // Import rovnaký ako si mal v ride.repository.ts
import type { User } from "../users/user.types";
import type { Ride } from "../rides/ride.types";

// ==========================================
// 1. BASE DATABASE TYPES (SELECT)
// ==========================================
export type Booking = InferSelectModel<typeof bookings>;
export type BookingStatusHistory = InferSelectModel<
    typeof bookingStatusHistory
>;

// ==========================================
// 2. DATABASE TYPES FOR INSERTION (INSERT)
// ==========================================
export type BookingInsert = InferInsertModel<typeof bookings>;
export type BookingStatusHistoryInsert = InferInsertModel<
    typeof bookingStatusHistory
>;

// ==========================================
// 3. SPECIFIC PROPERTIES AND ALIASES
// ==========================================
export type BookingStatus = Booking["bookingStatus"];
export type BookingTimeframe = "UPCOMING" | "PAST" | "ALL";

// ==========================================
// 4. SERVICE / REPOSITORY CONTRACTS (COMPOSITE TYPES)
// ==========================================

// Data passed from the service layer to the repository when creating a booking.
// Price is resolved inside the repository transaction.
export type CreateBookingInput = Pick<
    BookingInsert,
    "rideId" | "passengerId" | "pickupStopId" | "dropoffStopId" | "seatCount"
>;

// Defines how a single booking appears in the passenger's "My rides" list.
export type PassengerBookingListItem = {
    id: string;
    bookingStatus: BookingStatus;
    priceAmount: number;
    currency: string;
    seatsLeft: number;
    ride: Pick<Ride, "id" | "departureAt" | "rideStatus">;
    driver: Pick<User, "id" | "firstName" | "lastName" | "profilePhotoUrl"> & {
        averageRating: number | null;
        reviewCount: number;
    };
    pickupCity: string;
    dropoffCity: string;
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

export type DriverRideRequestItem = {
    id: string; // Booking ID used for confirm/reject operations
    rideId: string;
    seatCount: number;
    passenger: Pick<
        User,
        "id" | "firstName" | "lastName" | "profilePhotoUrl"
    > & {
        averageRating: number | null;
    };
    pickupCity: string;
    dropoffCity: string;
    departureAt: Date;
};
