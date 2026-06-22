import { useTranslation } from "react-i18next";
import { AvailableRideCard } from "../../../../../components/shared/AvailableRideCard";
import { formatRideDate } from "../../../../../lib/date-format";
import { useRideSearch } from "../../../../../hooks/shared/useRideSearch";
import type { useBookRide } from "../hooks/useBookRide";

type SearchRideRow = NonNullable<
    ReturnType<typeof useRideSearch>["data"]
>[number];

type SearchResultsListProps = {
    rides: SearchRideRow[];
    seats: number;
    startCity: string | null;
    destCity: string | null;
    book: ReturnType<typeof useBookRide>["book"];
};

// The filtered search-results list. Unlike the all-rides list, bookings carry
// the rider's requested pickup/dropoff (and any dynamic stop coordinates).
export function SearchResultsList({
    rides,
    seats,
    startCity,
    destCity,
    book,
}: SearchResultsListProps) {
    const { t } = useTranslation();

    return (
        <div className="flex flex-col gap-3">
            {rides.map((ride) => {
                const departure = new Date(
                    ride.pickupStop.plannedDepartureAt ?? ride.departureAt
                );
                const driverName =
                    `${ride.driver.firstName} ${ride.driver.lastName}`.trim();

                return (
                    <AvailableRideCard
                        key={ride.rideId}
                        from={startCity ?? ride.pickupStop.city}
                        to={destCity ?? ride.dropoffStop.city}
                        originalStartCity={ride.originalStartCity}
                        originalEndCity={ride.originalEndCity}
                        datetime={formatRideDate(departure, t("home.at"))}
                        seatsLeft={ride.seatsLeft}
                        driverName={driverName}
                        driverRating={ride.driver.averageRating ?? 0}
                        price={(ride.priceAmount ?? 0) * seats}
                        canBook={ride.seatsLeft >= seats}
                        onBook={() =>
                            book(
                                {
                                    rideId: ride.rideId,
                                    pickupStopId: ride.pickupStop.pickupStopId,
                                    dropoffStopId:
                                        ride.dropoffStop.dropoffStopId,
                                    seatCount: seats,
                                    dynamicPickup:
                                        ride.pickupStop.isDynamic &&
                                        ride.pickupStop.lat != null &&
                                        ride.pickupStop.lng != null
                                            ? {
                                                  lat: ride.pickupStop.lat,
                                                  lng: ride.pickupStop.lng,
                                                  city: ride.pickupStop.city,
                                              }
                                            : undefined,
                                    dynamicDropoff:
                                        ride.dropoffStop.isDynamic &&
                                        ride.dropoffStop.lat != null &&
                                        ride.dropoffStop.lng != null
                                            ? {
                                                  lat: ride.dropoffStop.lat,
                                                  lng: ride.dropoffStop.lng,
                                                  city: ride.dropoffStop.city,
                                              }
                                            : undefined,
                                    priceAmount: ride.priceAmount ?? undefined,
                                    requestedPickupCity: startCity ?? undefined,
                                    requestedDropoffCity: destCity ?? undefined,
                                },
                                {
                                    rideId: ride.rideId,
                                    pickupStopId: ride.pickupStop.pickupStopId,
                                    dropoffStopId:
                                        ride.dropoffStop.dropoffStopId,
                                    from: startCity ?? ride.pickupStop.city,
                                    to: destCity ?? ride.dropoffStop.city,
                                    date: departure.toISOString(),
                                    price: (ride.priceAmount ?? 0) * seats,
                                    driverName,
                                    driverRating:
                                        ride.driver.averageRating ?? 0,
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
                );
            })}
        </div>
    );
}
