import { db } from "../../../db";
import { BookingRepository } from "../booking.repository";
import type {
    BookingTimeframe,
    PassengerBookingListItem,
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
