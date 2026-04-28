import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "../lib/router-compat";
import { PassengerNavbar, AvailableRideCard } from "@waymate/ui";
import type { Language } from "@waymate/ui";
import { useCreateBooking } from "../hooks/useCreateBooking";
import { useAvailableRides } from "../hooks/useAvailableRides";
import { useRideSearch } from "../hooks/useRideSearch";
import { formatRideDate } from "../lib/date-format";
import { toUiLanguage } from "../lib/language";
import { useLogout } from "../hooks/useLogout";

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
    const logout = useLogout();
    const [searchParams] = useSearchParams();
    const createBooking = useCreateBooking();

    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const dateStr = searchParams.get("date");
    const hasSearchParams = !!from || !!to || !!dateStr;
    const showAllRides = !hasSearchParams;
    const {
        data: availableRideRows,
        isLoading: areAvailableRidesLoading,
        isError: areAvailableRidesError,
    } = useAvailableRides();

    const {
        data: rides,
        isLoading,
        isError,
        canSearch,
    } = useRideSearch({ from, to, date: dateStr });

    const availableRides =
        availableRideRows?.map((ride) => {
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
                date: departure,
                seatsLeft: ride.seatsLeft,
                driverName: driverName || t("roles.driver"),
                driverRating: ride.driver.averageRating ?? 0,
                price: ride.priceAmount ?? 0,
            };
        }) ?? [];

    const count = showAllRides ? availableRides.length : (rides?.length ?? 0);

    return (
        <div
            data-theme={theme}
            className="min-h-screen bg-(--color-bg)"
        >
            <PassengerNavbar
                activeTab="find-ride"
                language={toUiLanguage(language)}
                onLanguageChange={onLanguageChange}
                role="passenger"
                onRoleChange={(r) => r === "driver" && navigate("/driver")}
                theme={theme}
                onThemeToggle={onThemeToggle}
                userName={userName}
                userEmail={userEmail}
                onLogoClick={() => navigate("/passenger")}
                onFindRideClick={() => navigate("/passenger")}
                onMyRidesClick={() => navigate("/passenger/rides")}
                onChatClick={() => navigate("/passenger/chat")}
                onMessagesClick={() => navigate("/passenger/chat")}
                onProfileClick={() => navigate("/passenger/profile")}
                onRatingsClick={() =>
                    navigate("/passenger/ratings?view=authored")
                }
                onLogoutClick={logout}
                labels={{
                    passenger: t("roles.passenger"),
                    driver: t("roles.driver"),
                    findRide: t("nav.findRide"),
                    myRides: t("nav.myRides"),
                    chat: t("nav.chat"),
                    profile: t("nav.profile"),
                    dropdownMyRides: t("nav.myRides"),
                    messages: t("nav.messages"),
                    ratings: t("nav.ratings"),
                    settings: t("nav.settings"),
                    logout: t("nav.logout"),
                }}
            />

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
                        {t("rides.error")}
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
                        {t("rides.error")}
                    </p>
                )}

                {createBooking.isError && (
                    <p className="text-(--color-text-secondary) mt-4">
                        {t("bookings.createError")}
                    </p>
                )}

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
                                    datetime={formatRideDate(
                                        ride.date,
                                        t("home.at")
                                    )}
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
                                    from={ride.pickupStop.city}
                                    to={ride.dropoffStop.city}
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
                                                                    from: ride
                                                                        .pickupStop
                                                                        .city,
                                                                    to: ride
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
