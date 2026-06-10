export type UpcomingRide = {
    id: number | string;
    rideId?: string;
    pickupStopId?: string;
    dropoffStopId?: string;
    from: string;
    to: string;
    date: Date | string;
    price: number;
    duration?: string;
    driverName: string;
    driverRating: number;
    seatsLeft: number;
    status: "pending" | "confirmed";
};
