import type { PassengerBookingListItem } from "../../../../api-client/model/passengerBookingListItem";
import type { UpcomingRide } from "../../../../features/passenger/types";
import { formatDuration } from "../../../../lib/date-format";

// View model for the passenger "My rides" cards. Extends the shared UpcomingRide
// shape with the few fields the page needs for rating/reporting a driver.
export type DisplayedRide = UpcomingRide & {
    driverId?: string;
    rideId?: string;
    alreadyReviewed?: boolean;
};

/**
 * Maps the `GET /bookings/me` rows into the card view model. Prefers the
 * passenger's requested pickup/dropoff cities over the ride's stop cities, and
 * derives the trip duration from departure/arrival estimates.
 */
export function mapBookingsToRides(
    bookings: PassengerBookingListItem[] | undefined
): DisplayedRide[] | undefined {
    return bookings?.map((booking) => ({
        id: booking.id,
        from: booking.requestedPickupCity ?? booking.pickupCity,
        to: booking.requestedDropoffCity ?? booking.dropoffCity,
        date: booking.ride.departureAt,
        price: booking.priceAmount,
        duration: formatDuration(
            booking.ride.departureAt,
            booking.ride.arrivalEstimateAt
        ),
        driverName:
            `${booking.driver.firstName ?? ""} ${booking.driver.lastName ?? ""}`.trim(),
        driverRating: booking.driver.averageRating ?? 0,
        seatsLeft: booking.seatsLeft,
        status:
            booking.bookingStatus === "CONFIRMED"
                ? ("confirmed" as const)
                : ("pending" as const),
        driverId: booking.driver.id,
        rideId: booking.ride.id,
        alreadyReviewed: booking.myReviewOfDriver !== null,
    }));
}
