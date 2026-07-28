import { db } from "../../../db";
import { BookingRepository } from "../booking.repository";
import { BookingError, BookingErrorCodes } from "../booking.errors";
import type {
    BookingTimeframe,
    PassengerBookingListItem,
    PassengerBookingDetail,
} from "../booking.types";

export const getPendingRequestsForDriver = async (driverId: string) => {
    return await BookingRepository.findPendingRequestsForDriver(db, driverId);
};

export const getPassengerBookings = async (
    passengerId: string,
    timeframe?: BookingTimeframe
): Promise<PassengerBookingListItem[]> => {
    const rows = await BookingRepository.findBookingsByPassengerId(
        db,
        passengerId,
        timeframe
    );

    return rows.map(
        ({ myReviewOfDriverId, myReviewOfDriverRating, ...rest }) => ({
            ...rest,
            myReviewOfDriver:
                myReviewOfDriverId !== null && myReviewOfDriverRating !== null
                    ? {
                          id: myReviewOfDriverId,
                          rating: myReviewOfDriverRating,
                      }
                    : null,
        })
    );
};

export const getBookingDetailForPassenger = async (
    bookingId: string,
    passengerId: string
): Promise<PassengerBookingDetail> => {
    const row = await BookingRepository.findBookingDetailById(db, bookingId);

    if (!row) {
        throw new BookingError(BookingErrorCodes.BookingNotFound);
    }

    if (row.passengerId !== passengerId) {
        throw new BookingError(BookingErrorCodes.UnauthorizedAction);
    }

    const { passengerId: _passengerId, ...detail } = row;

    const coPassengers = await BookingRepository.findCoPassengersForRide(
        db,
        detail.ride.id,
        passengerId
    );

    return { ...detail, coPassengers };
};
