import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "../lib/router-compat";
import { AuthNavbar, AvailableRideCard, Button } from "@waymate/ui";
import type { Language } from "@waymate/ui";
import { useRideSearch } from "../hooks/useRideSearch";
import { useAuthNavbarProps } from "../hooks/useAuthNavbarProps";
import { useGetRidesAvailable } from "../api-client/rides/rides";
import { getErrorI18nKey } from "../lib/api-errors";
import { formatRideDate } from "../lib/date-format";

type RidesPageProps = {
    language: Language;
    theme: "light" | "dark";
    onLanguageChange: (lang: Language) => void;
    onThemeToggle: () => void;
    onLogin?: () => void;
    onRegister?: () => void;
    onLogoClick?: () => void;
};

export function RidesPage({
    language,
    theme,
    onLanguageChange,
    onThemeToggle,
    onLogin,
    onRegister,
    onLogoClick,
}: RidesPageProps) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const authNavbarProps = useAuthNavbarProps({
        language,
        onLanguageChange,
        theme,
        onThemeToggle,
        onLogin,
        onRegister,
        onLogoClick,
    });
    const [searchParams] = useSearchParams();
    const [showGuestModal, setShowGuestModal] = useState(false);

    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const dateStr = searchParams.get("date");
    const hasSearchParams = !!from || !!to || !!dateStr;
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
    } = useRideSearch({ from, to, date: dateStr });

    const availableRides =
        availableRideRows?.map((ride) => {
            const driverName = [ride.driver.firstName, ride.driver.lastName]
                .filter(Boolean)
                .join(" ");

            return {
                id: ride.rideId,
                from: ride.pickupStop.city,
                to: ride.dropoffStop.city,
                date: new Date(
                    ride.pickupStop.plannedDepartureAt ?? ride.departureAt
                ),
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
            <AuthNavbar {...authNavbarProps} />

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
                    <p className="text-(--color-text-secondary) mt-1">
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

                {canSearch && isError && (
                    <p className="text-(--color-text-secondary) mt-1">
                        {t(getErrorI18nKey(searchError, {}, "rides.error"))}
                    </p>
                )}

                {canSearch && !isLoading && !isError && (
                    <p className="text-(--color-text-secondary) mt-1 mb-8">
                        {t("rides.found", { count })}
                    </p>
                )}

                {rides && rides.length === 0 && (
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
                                    onBook={() => setShowGuestModal(true)}
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
                        {rides.map((ride) => (
                            <AvailableRideCard
                                key={ride.rideId}
                                from={ride.pickupStop.city}
                                to={ride.dropoffStop.city}
                                datetime={formatRideDate(
                                    new Date(
                                        ride.pickupStop.plannedDepartureAt ??
                                            ride.departureAt
                                    ),
                                    t("home.at")
                                )}
                                seatsLeft={ride.seatsLeft}
                                driverName={`${ride.driver.firstName} ${ride.driver.lastName}`}
                                driverRating={0}
                                price={ride.priceAmount ?? 0}
                                onBook={() => setShowGuestModal(true)}
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
            </section>

            {showGuestModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={() => setShowGuestModal(false)}
                    />
                    <div className="relative bg-(--color-card) rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center flex flex-col gap-4">
                        <div className="text-4xl">🔒</div>
                        <h2 className="text-xl font-bold text-(--color-text-primary)">
                            {t("bookGuest.title")}
                        </h2>
                        <p className="text-(--color-text-secondary) text-sm">
                            {t("bookGuest.message")}
                        </p>
                        <div className="flex gap-3 mt-2">
                            <Button
                                variant="secondary"
                                fullWidth
                                onClick={() => {
                                    setShowGuestModal(false);
                                    if (onLogin) {
                                        onLogin();
                                    } else {
                                        navigate("/login");
                                    }
                                }}
                            >
                                {t("bookGuest.login")}
                            </Button>
                            <Button
                                fullWidth
                                onClick={() => {
                                    setShowGuestModal(false);
                                    if (onRegister) {
                                        onRegister();
                                    } else {
                                        navigate("/register");
                                    }
                                }}
                            >
                                {t("bookGuest.register")}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
