import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "../../../lib/router-compat";
import type { Language } from "../../../components/controls/LanguageSwitcher";
import { PassengerNavbar } from "../../../components/navigation/PassengerNavbar";
import { AvailableRideCard } from "../../../components/shared/AvailableRideCard";
import { usePassengerNavbarProps } from "../../../hooks/shared/usePassengerNavbarProps";
import { useCreateBooking } from "../hooks/useCreateBooking";
import { useGetRidesAvailable } from "../../../api-client/rides/rides";
import { useRideSearch } from "../../../hooks/shared/useRideSearch";
import { getErrorI18nKey } from "../../../lib/api-errors";
import { formatRideDate, formatDuration } from "../../../lib/date-format";
import { BookingErrorModal } from "../components/BookingErrorModal";

type PassengerRidesPageProps = {
    language: Language;
    theme: "light" | "dark";
    onLanguageChange: (lang: Language) => void;
    onThemeToggle: () => void;
    userName?: string;
    userEmail?: string;
};

export function PassengerRidesPage({
    language,
    theme,
    onLanguageChange,
    onThemeToggle,
    userName,
    userEmail,
}: PassengerRidesPageProps) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const navbarProps = usePassengerNavbarProps({
        activeTab: "find-ride",
        language,
        onLanguageChange,
        theme,
        onThemeToggle,
        userName,
        userEmail,
    });
    const [searchParams] = useSearchParams();
    const createBooking = useCreateBooking();

    const startLat = searchParams.has("startLat")
        ? parseFloat(searchParams.get("startLat")!)
        : null;
    const startLng = searchParams.has("startLng")
        ? parseFloat(searchParams.get("startLng")!)
        : null;
    const startCity = searchParams.get("startCity");
    const destLat = searchParams.has("destLat")
        ? parseFloat(searchParams.get("destLat")!)
        : null;
    const destLng = searchParams.has("destLng")
        ? parseFloat(searchParams.get("destLng")!)
        : null;
    const destCity = searchParams.get("destCity");
    const dateStr = searchParams.get("date");

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
        ? availableRideRows.map((ride) => {
              const departure = new Date(
                  ride.pickupStop.plannedDepartureAt ?? ride.departureAt
              );
              const driverName = [ride.driver.firstName, ride.driver.lastName]
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
                  price: ride.priceAmount ?? 0,
              };
          })
        : [];

    const count = showAllRides ? availableRides.length : (rides?.length ?? 0);

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

                {canSearch && !isLoading && !isError && rides?.length === 0 && (
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
                                    onBook={() =>
                                        createBooking.mutate(
                                            {
                                                rideId: ride.rideId,
                                                pickupStopId: ride.pickupStopId,
                                                dropoffStopId:
                                                    ride.dropoffStopId,
                                            },
                                            {
                                                onSuccess: (booking) => {
                                                    navigate(
                                                        "/passenger/rides",
                                                        {
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
                                                        }
                                                    );
                                                },
                                            }
                                        )
                                    }
                                    labels={{
                                        seatsLeft: (count) =>
                                            t("home.availableRides.seatsLeft", {
                                                count,
                                            }),
                                        book: t("home.availableRides.book"),
                                    }}
                                />
                            ))}
                        </div>
                    )}

                {!showAllRides && rides && rides.length > 0 && (
                    <div className="flex flex-col gap-3">
                        {rides.map((ride) => {
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
                                    driverRating={0}
                                    price={ride.priceAmount ?? 0}
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
                                                    navigate(
                                                        "/passenger/rides",
                                                        {
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
                                                                        ride.priceAmount ??
                                                                        0,
                                                                    driverName,
                                                                    driverRating: 0,
                                                                    seatsLeft:
                                                                        ride.seatsLeft,
                                                                    status: "pending",
                                                                },
                                                            },
                                                        }
                                                    );
                                                },
                                            }
                                        )
                                    }
                                    labels={{
                                        seatsLeft: (count) =>
                                            t("home.availableRides.seatsLeft", {
                                                count,
                                            }),
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
