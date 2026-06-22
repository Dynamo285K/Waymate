import { useTranslation } from "react-i18next";
import { AvailableRideCard } from "../../../../../components/shared/AvailableRideCard";
import { formatRideDate, formatDuration } from "../../../../../lib/date-format";
import type { AvailableRideItem } from "../../../../../api-client/model/availableRideItem";
import type { useBookRide } from "../hooks/useBookRide";

type AllRidesListProps = {
    rows: AvailableRideItem[];
    seats: number;
    book: ReturnType<typeof useBookRide>["book"];
};

// The "browse all rides" list (no active search filters). Maps the raw API
// rows into card view models and books with a plain pickup/dropoff payload.
export function AllRidesList({ rows, seats, book }: AllRidesListProps) {
    const { t } = useTranslation();

    const rides = rows.map((ride) => {
        const departure = new Date(
            ride.pickupStop.plannedDepartureAt ?? ride.departureAt
        );
        const driverName = [ride.driver.firstName, ride.driver.lastName]
            .filter(Boolean)
            .join(" ");

        return {
            rideId: ride.rideId,
            pickupStopId: ride.pickupStop.pickupStopId,
            dropoffStopId: ride.dropoffStop.dropoffStopId,
            from: ride.pickupStop.city,
            to: ride.dropoffStop.city,
            originalStartCity: ride.originalStartCity,
            originalEndCity: ride.originalEndCity,
            date: departure,
            duration: formatDuration(ride.departureAt, ride.arrivalEstimateAt),
            seatsLeft: ride.seatsLeft,
            driverName: driverName || t("roles.driver"),
            driverRating: ride.driver.averageRating ?? 0,
            price: (ride.priceAmount ?? 0) * seats,
        };
    });

    return (
        <div className="flex flex-col gap-3">
            {rides.map((ride) => (
                <AvailableRideCard
                    key={ride.rideId}
                    from={ride.from}
                    to={ride.to}
                    originalStartCity={ride.originalStartCity}
                    originalEndCity={ride.originalEndCity}
                    datetime={formatRideDate(ride.date, t("home.at"))}
                    duration={ride.duration}
                    seatsLeft={ride.seatsLeft}
                    driverName={ride.driverName}
                    driverRating={ride.driverRating}
                    price={ride.price}
                    canBook={ride.seatsLeft >= seats}
                    onBook={() =>
                        book(
                            {
                                rideId: ride.rideId,
                                pickupStopId: ride.pickupStopId,
                                dropoffStopId: ride.dropoffStopId,
                                seatCount: seats,
                            },
                            {
                                rideId: ride.rideId,
                                pickupStopId: ride.pickupStopId,
                                dropoffStopId: ride.dropoffStopId,
                                from: ride.from,
                                to: ride.to,
                                date: ride.date.toISOString(),
                                price: ride.price,
                                driverName: ride.driverName,
                                driverRating: ride.driverRating,
                                seatsLeft: ride.seatsLeft,
                                status: "pending",
                            }
                        )
                    }
                    labels={{
                        seatsLeft: (count) =>
                            t("home.availableRides.seatsLeft", { count }),
                        full: t("driverRides.full"),
                        book: t("home.availableRides.book"),
                    }}
                />
            ))}
        </div>
    );
}
