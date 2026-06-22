import { db } from "../../../db";
import { RideRepository } from "../ride.repository";
import { RideError, RideErrorCodes } from "../ride.errors";
import { REVIEW_WINDOW_DAYS } from "../../reviews/review.service";
import type { RidePassengersView, RideTimeframe } from "../ride.types";

export const getDriverRides = async (
    driverId: string,
    timeframe?: RideTimeframe
) => {
    return await RideRepository.findRidesByDriverId(db, driverId, timeframe);
};

export const getRidePassengers = async (
    rideId: string,
    driverId: string
): Promise<RidePassengersView> => {
    const bundle = await RideRepository.findRidePassengersBundle(
        db,
        rideId,
        driverId
    );

    if (!bundle) throw new RideError(RideErrorCodes.RideNotFoundOrNotOwner);

    // Independent SELECT — driver's own reviews of these passengers, used to
    // surface "already reviewed" state in the UI. Empty subjectIds short-
    // circuits inside the repo function.
    const passengerIds = bundle.bookings.map((b) => b.passenger.id);
    const [driverReviews, passengerRatings] = await Promise.all([
        RideRepository.findReviewsByAuthorForSubjects(
            db,
            rideId,
            driverId,
            passengerIds
        ),
        RideRepository.findAverageRatingsByUserIds(db, passengerIds),
    ]);
    const reviewBySubject = new Map(
        driverReviews.map((r) => [r.subjectId, { id: r.id, rating: r.rating }])
    );
    const ratingByPassenger = new Map(
        passengerRatings.map((r) => [r.subjectId, r.averageRating])
    );

    const windowClosesAt = new Date(
        bundle.departureAt.getTime() + REVIEW_WINDOW_DAYS * 24 * 60 * 60 * 1000
    );
    const canReview =
        bundle.rideStatus === "COMPLETED" && new Date() <= windowClosesAt;

    return {
        ride: {
            id: bundle.id,
            departureAt: bundle.departureAt,
            rideStatus: bundle.rideStatus,
            offeredSeats: bundle.offeredSeats,
            currency: bundle.currency,
            rideStops: bundle.rideStops,
            canReview,
        },
        passengerCount: bundle.bookings.reduce(
            (sum, b) => sum + b.seatCount,
            0
        ),
        passengers: bundle.bookings.map((b) => ({
            bookingId: b.id,
            bookingStatus: b.bookingStatus,
            seatCount: b.seatCount,
            priceAmount: b.priceAmount,
            currency: b.currency,
            requestedPickupCity: b.requestedPickupCity,
            requestedDropoffCity: b.requestedDropoffCity,
            passenger: {
                ...b.passenger,
                averageRating: ratingByPassenger.get(b.passenger.id) ?? null,
                reviewCount: 0,
            },
            pickupStop: b.pickupStop,
            dropoffStop: b.dropoffStop,
            myReviewOfPassenger: reviewBySubject.get(b.passenger.id) ?? null,
        })),
    };
};
