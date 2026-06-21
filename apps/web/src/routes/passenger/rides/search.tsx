import { useTranslation } from "react-i18next";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PassengerNavbar } from "../../../components/navigation/PassengerNavbar";
import { AvailableRideCard } from "../../../components/shared/AvailableRideCard";
import { usePassengerNavbarProps } from "../../../hooks/shared/usePassengerNavbarProps";
import { useCreateBooking } from "../../../features/passenger/hooks/useCreateBooking";
import { useGetRidesAvailable } from "../../../api-client/rides/rides";
import { useRideSearch } from "../../../hooks/shared/useRideSearch";
import { getErrorI18nKey } from "../../../lib/api-errors";
import { formatRideDate, formatDuration } from "../../../lib/date-format";
import { BookingErrorModal } from "../../../features/passenger/components/BookingErrorModal";
import { rideSearchSchema } from "../../../lib/ride-search-schema";
import { authClient } from "../../../lib/auth-client";
import { getDisplayName } from "../../../lib/session-user";
import { requireAudience } from "../../../lib/route-guards";
import { useLayout } from "../../../lib/use-layout";

export const Route = createFileRoute("/passenger/rides/search")({
    beforeLoad: requireAudience(["user"]),
    validateSearch: rideSearchSchema,
    component: PassengerRidesPage,
});

export function PassengerRidesPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { language, theme, onLanguageChange, onThemeToggle } = useLayout();
    const { data: session } = authClient.useSession();
    const user = session?.user;
    const userName = user ? getDisplayName(user) : undefined;
    const userEmail = user?.email;
    const navbarProps = usePassengerNavbarProps({
        activeTab: "find-ride",
        language,
        onLanguageChange,
        theme,
        onThemeToggle,
        userName,
        userEmail,
    });
    const search = Route.useSearch();
    const createBooking = useCreateBooking();

    const startLat = search.startLat ?? null;
    const startLng = search.startLng ?? null;
    const startCity = search.startCity ?? null;
    const destLat = search.destLat ?? null;
    const destLng = search.destLng ?? null;
    const destCity = search.destCity ?? null;
    const dateStr = search.date ?? null;
    const seats = search.seats ?? 1;

    const hasSearchParams =
        (startLat !== null && startLng !== null) ||
        (destLat !== null && destLng !== null) ||
        !!dateStr;
    const showAllRides = !hasSearchParams;

    const {
        data: availableRideRows,
        isLoading: areAvailableRidesLoading,
        isError: areAvailableRidesError,
        error: availableRidesError,
    } = useGetRidesAvailable();

    const {
        data: rides,
        isLoading,
        isError,
        error: searchError,
        canSearch,
    } = useRideSearch({
        startLat,
        startLng,
        startCity,
        destLat,
        destLng,
        destCity,
        date: dateStr,
    });

    const availableRides = Array.isArray(availableRideRows)
        ? availableRideRows
              .map((ride) => {
                  const departure = new Date(
                      ride.pickupStop.plannedDepartureAt ?? ride.departureAt
                  );
                  const driverName = [
                      ride.driver.firstName,
                      ride.driver.lastName,
                  ]
                      .filter(Boolean)
                      .join(" ");

                  return {
                      id: ride.rideId,
                      rideId: ride.rideId,
                      pickupStopId: ride.pickupStop.pickupStopId,
                      dropoffStopId: ride.dropoffStop.dropoffStopId,
                      from: ride.pickupStop.city,
                      to: ride.dropoffStop.city,
                      originalStartCity: ride.originalStartCity,
                      originalEndCity: ride.originalEndCity,
                      date: departure,
                      duration: formatDuration(
                          ride.departureAt,
                          ride.arrivalEstimateAt
                      ),
                      seatsLeft: ride.seatsLeft,
                      driverName: driverName || t("roles.driver"),
                      driverRating: ride.driver.averageRating ?? 0,
                      price: (ride.priceAmount ?? 0) * seats,
                      pricePerSeat: ride.priceAmount ?? 0,
                  };
              })
        : [];

    const displayedRides = rides ?? [];
    const count = showAllRides ? availableRides.length : displayedRides.length;

    return (
        <div
            data-theme={theme}
            className="min-h-screen bg-(--color-bg)"
        >
            <PassengerNavbar {...navbarProps} />

            <section className="w-full px-4 sm:max-w-3xl sm:mx-auto sm:px-8 py-8 sm:py-12">
                <h2 className="text-2xl font-bold text-(--color-text-primary)">
                    {t("home.availableRides.title")}
                </h2>

                {showAllRides && (
                    <p className="text-(--color-text-secondary) mt-1 mb-8">
                        {t("rides.found", { count })}
                    </p>
                )}

                {showAllRides && areAvailableRidesLoading && (
                    <p className="text-(--color-text-secondary) mt-1">
                        {t("rides.loading")}
                    </p>
                )}

                {showAllRides && areAvailableRidesError && (
                    <p className="text-(--color-text-secondary) mt-4">
                        {t(
                            getErrorI18nKey(
                                availableRidesError,
                                {},
                                "rides.error"
                            )
                        )}
                    </p>
                )}

                {hasSearchParams && !canSearch && (
                    <p className="text-(--color-text-secondary) mt-1">
                        {t("rides.noSearchParams")}
                    </p>
                )}

                {canSearch && isLoading && (
                    <p className="text-(--color-text-secondary) mt-1">
                        {t("rides.loading")}
                    </p>
                )}

                {canSearch && !isLoading && !isError && (
                    <p className="text-(--color-text-secondary) mt-1 mb-8">
                        {t("rides.found", { count })}
                    </p>
                )}

                {canSearch && !isLoading && isError && (
                    <p className="text-(--color-text-secondary) mt-4">
                        {t(getErrorI18nKey(searchError, {}, "rides.error"))}
                    </p>
                )}

                <BookingErrorModal
                    isError={createBooking.isError}
                    error={createBooking.error}
                    onClose={() => createBooking.reset()}
                />

                {canSearch &&
                    !isLoading &&
                    !isError &&
                    displayedRides.length === 0 && (
                        <p className="text-(--color-text-secondary) mt-4">
                            {t("rides.noResults")}
                        </p>
                    )}

                {showAllRides &&
                    !areAvailableRidesLoading &&
                    !areAvailableRidesError &&
                    availableRides.length === 0 && (
                        <p className="text-(--color-text-secondary) mt-4">
                            {t("rides.noResults")}
                        </p>
                    )}

                {showAllRides &&
                    !areAvailableRidesLoading &&
                    !areAvailableRidesError && (
                        <div className="flex flex-col gap-3">
                            {availableRides.map((ride) => (
                                <AvailableRideCard
                                    key={ride.id}
                                    from={ride.from}
                                    to={ride.to}
                                    originalStartCity={ride.originalStartCity}
                                    originalEndCity={ride.originalEndCity}
                                    datetime={formatRideDate(
                                        ride.date,
                                        t("home.at")
                                    )}
                                    duration={ride.duration}
                                    seatsLeft={ride.seatsLeft}
                                    driverName={ride.driverName}
                                    driverRating={ride.driverRating}
                                    price={ride.price}
                                    canBook={ride.seatsLeft >= seats}
                                    onBook={() =>
                                        createBooking.mutate(
                                            {
                                                rideId: ride.rideId,
                                                pickupStopId: ride.pickupStopId,
                                                dropoffStopId:
                                                    ride.dropoffStopId,
                                                seatCount: seats,
                                            },
                                            {
                                                onSuccess: (booking) => {
                                                    navigate({
                                                        to: "/passenger/rides",
                                                        state: {
                                                            bookedRide: {
                                                                id: booking.id,
                                                                rideId: ride.rideId,
                                                                pickupStopId:
                                                                    ride.pickupStopId,
                                                                dropoffStopId:
                                                                    ride.dropoffStopId,
                                                                from: ride.from,
                                                                to: ride.to,
                                                                date: ride.date.toISOString(),
                                                                price: ride.price,
                                                                driverName:
                                                                    ride.driverName,
                                                                driverRating:
                                                                    ride.driverRating,
                                                                seatsLeft:
                                                                    ride.seatsLeft,
                                                                status: "pending",
                                                            },
                                                        },
                                                    });
                                                },
                                            }
                                        )
                                    }
                                    labels={{
                                        seatsLeft: (count) =>
                                            t("home.availableRides.seatsLeft", {
                                                count,
                                            }),
                                        full: t("driverRides.full"),
                                        book: t("home.availableRides.book"),
                                    }}
                                />
                            ))}
                        </div>
                    )}

                {!showAllRides && displayedRides.length > 0 && (
                    <div className="flex flex-col gap-3">
                        {displayedRides.map((ride) => {
                            const departure = new Date(
                                ride.pickupStop.plannedDepartureAt ??
                                    ride.departureAt
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
                                    datetime={formatRideDate(
                                        departure,
                                        t("home.at")
                                    )}
                                    seatsLeft={ride.seatsLeft}
                                    driverName={driverName}
                                    driverRating={
                                        ride.driver.averageRating ?? 0
                                    }
                                    price={(ride.priceAmount ?? 0) * seats}
                                    canBook={ride.seatsLeft >= seats}
                                    onBook={() =>
                                        createBooking.mutate(
                                            {
                                                rideId: ride.rideId,
                                                pickupStopId:
                                                    ride.pickupStop
                                                        .pickupStopId,
                                                dropoffStopId:
                                                    ride.dropoffStop
                                                        .dropoffStopId,
                                                seatCount: seats,
                                                dynamicPickup:
                                                    ride.pickupStop.isDynamic &&
                                                    ride.pickupStop.lat !=
                                                        null &&
                                                    ride.pickupStop.lng != null
                                                        ? {
                                                              lat: ride
                                                                  .pickupStop
                                                                  .lat,
                                                              lng: ride
                                                                  .pickupStop
                                                                  .lng,
                                                              city: ride
                                                                  .pickupStop
                                                                  .city,
                                                          }
                                                        : undefined,
                                                dynamicDropoff:
                                                    ride.dropoffStop
                                                        .isDynamic &&
                                                    ride.dropoffStop.lat !=
                                                        null &&
                                                    ride.dropoffStop.lng != null
                                                        ? {
                                                              lat: ride
                                                                  .dropoffStop
                                                                  .lat,
                                                              lng: ride
                                                                  .dropoffStop
                                                                  .lng,
                                                              city: ride
                                                                  .dropoffStop
                                                                  .city,
                                                          }
                                                        : undefined,
                                                priceAmount:
                                                    ride.priceAmount ??
                                                    undefined,
                                                requestedPickupCity:
                                                    startCity ?? undefined,
                                                requestedDropoffCity:
                                                    destCity ?? undefined,
                                            },
                                            {
                                                onSuccess: (booking) => {
                                                    navigate({
                                                        to: "/passenger/rides",
                                                        state: {
                                                            bookedRide: {
                                                                id: booking.id,
                                                                rideId: ride.rideId,
                                                                pickupStopId:
                                                                    ride
                                                                        .pickupStop
                                                                        .pickupStopId,
                                                                dropoffStopId:
                                                                    ride
                                                                        .dropoffStop
                                                                        .dropoffStopId,
                                                                from:
                                                                    startCity ??
                                                                    ride
                                                                        .pickupStop
                                                                        .city,
                                                                to:
                                                                    destCity ??
                                                                    ride
                                                                        .dropoffStop
                                                                        .city,
                                                                date: departure.toISOString(),
                                                                price:
                                                                    (ride.priceAmount ??
                                                                        0) *
                                                                    seats,
                                                                driverName,
                                                                driverRating:
                                                                    ride.driver
                                                                        .averageRating ??
                                                                    0,
                                                                seatsLeft:
                                                                    ride.seatsLeft,
                                                                status: "pending",
                                                            },
                                                        },
                                                    });
                                                },
                                            }
                                        )
                                    }
                                    labels={{
                                        seatsLeft: (count) =>
                                            t("home.availableRides.seatsLeft", {
                                                count,
                                            }),
                                        full: t("driverRides.full"),
                                        book: t("home.availableRides.book"),
                                    }}
                                />
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    );
}
