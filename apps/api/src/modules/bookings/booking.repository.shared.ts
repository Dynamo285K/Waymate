import { isNull } from "drizzle-orm";
import { bookings as bookingsTable } from "../../db/schema/booking";
import { rides as ridesTable } from "../../db/schema/ride";

export const bookingNotSoftDeleted = isNull(bookingsTable.deletedAt);
export const rideNotSoftDeleted = isNull(ridesTable.deletedAt);

export type RideForBookingContext = {
    id: string;
    driverId: string;
    rideStatus: string;
    offeredSeats: number;
};

export type BookingRow = typeof bookingsTable.$inferSelect;
