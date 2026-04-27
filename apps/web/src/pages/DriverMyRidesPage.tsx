import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "../lib/router-compat";
import { DriverNavbar, RideCard, Button } from "@waymate/ui";
import type { Language } from "@waymate/ui";
import { useDriverRides } from "../hooks/useDriverRides";
import i18n from "../i18n";

type DriverMyRidesPageProps = {
    language: Language;
    theme: "light" | "dark";
    onLanguageChange: (lang: Language) => void;
    onThemeToggle: () => void;
    userName?: string;
    userEmail?: string;
};

const LOCALE_MAP: Record<string, string> = {
    en: "en-US",
    sk: "sk-SK",
    cz: "cs-CZ",
};

function formatDate(date: Date, atLabel: string): string {
    const locale = LOCALE_MAP[i18n.language] ?? "en-US";
    const datePart = new Intl.DateTimeFormat(locale, {
        day: "numeric",
        month: "long",
    }).format(date);
    const timePart = new Intl.DateTimeFormat(locale, {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    }).format(date);
    return `${datePart} ${atLabel} ${timePart}`;
}

export function DriverMyRidesPage({
    language,
    theme,
    onLanguageChange,
    onThemeToggle,
    userName,
    userEmail,
}: DriverMyRidesPageProps) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [tab, setTab] = useState("upcoming");
    const timeframe = tab === "past" ? "PAST" : "UPCOMING";
    const { data: rides, isLoading, isError } = useDriverRides(timeframe);
    const displayedRides =
        rides?.map((ride) => {
            const sortedStops = [...ride.rideStops].sort(
                (a, b) => a.stopOrder - b.stopOrder
            );
            const from = sortedStops[0]?.city ?? "";
            const to = sortedStops[sortedStops.length - 1]?.city ?? "";
            const confirmedSeats = ride.bookings.reduce(
                (sum, booking) => sum + booking.seatCount,
                0
            );
            const remainingSeats = ride.offeredSeats - confirmedSeats;
            const seatsLeft: number | "full" =
                remainingSeats > 0 ? remainingSeats : "full";
            const price = ride.prices[0]?.amount ?? 0;

            return {
                id: ride.id,
                from,
                to,
                date: ride.departureAt,
                price,
                seatsLeft,
            };
        }) ?? [];

    const navbarLabels = {
        passenger: t("roles.passenger"),
        driver: t("roles.driver"),
        offerRide: t("driver.nav.offerRide"),
        myRides: t("driver.nav.myRides"),
        rideRequests: t("driver.nav.rideRequests"),
        chat: t("driver.nav.chat"),
        profile: t("nav.profile"),
        dropdownMyRides: t("driver.nav.myRides"),
        messages: t("nav.messages"),
        ratings: t("nav.ratings"),
        settings: t("nav.settings"),
        logout: t("nav.logout"),
    };

    return (
        <div
            data-theme={theme}
            className="min-h-screen bg-(--color-bg)"
        >
            <DriverNavbar
                activeTab="my-rides"
                language={language}
                onLanguageChange={onLanguageChange}
                role="driver"
                onRoleChange={(r) =>
                    r === "passenger" && navigate("/passenger")
                }
                theme={theme}
                onThemeToggle={onThemeToggle}
                userName={userName}
                userEmail={userEmail}
                onLogoClick={() => navigate("/driver")}
                onOfferRideClick={() => navigate("/driver")}
                onMyRidesClick={() => navigate("/driver/rides")}
                onRideRequestsClick={() => navigate("/driver/requests")}
                onChatClick={() => navigate("/driver/chat")}
                onMessagesClick={() => navigate("/driver/chat")}
                onProfileClick={() => navigate("/driver/profile")}
                onRatingsClick={() => navigate("/driver/ratings")}
                onLogoutClick={() => navigate("/")}
                labels={navbarLabels}
            />

            <section className="w-full px-4 sm:max-w-3xl sm:mx-auto sm:px-8 py-8 sm:py-12">
                <h1 className="text-2xl font-bold text-(--color-text-primary) mb-6">
                    {t("driverRides.title")}
                </h1>

                <div className="flex gap-2 mb-6">
                    <Button
                        variant={tab === "upcoming" ? "black" : "secondary"}
                        onClick={() => setTab("upcoming")}
                    >
                        {t("driverRides.upcoming")}
                    </Button>
                    <Button
                        variant={tab === "past" ? "black" : "secondary"}
                        onClick={() => setTab("past")}
                    >
                        {t("driverRides.past")}
                    </Button>
                </div>

                <div className="flex flex-col gap-4">
                    {isLoading && (
                        <p className="text-(--color-text-secondary)">
                            {t("driverRides.loading")}
                        </p>
                    )}

                    {isError && (
                        <p className="text-(--color-text-secondary)">
                            {t("driverRides.error")}
                        </p>
                    )}

                    {!isLoading && !isError && displayedRides.length === 0 && (
                        <p className="text-(--color-text-secondary)">
                            {t("driverRides.noResults")}
                        </p>
                    )}

                    {!isLoading &&
                        !isError &&
                        displayedRides.map((ride) => {
                            return tab === "upcoming" ? (
                                <RideCard
                                    key={ride.id}
                                    variant="driver-upcoming"
                                    from={ride.from}
                                    to={ride.to}
                                    datetime={formatDate(
                                        new Date(ride.date),
                                        t("home.at")
                                    )}
                                    price={ride.price}
                                    seatsLeft={ride.seatsLeft}
                                    onViewPassengers={() =>
                                        navigate("/driver/rides/passengers", {
                                            state: { ride },
                                        })
                                    }
                                    onCancelRide={() => {}}
                                    labels={{
                                        seatsLeft: (count) =>
                                            t("driverRides.seatsLeft", {
                                                count,
                                            }),
                                        full: t("driverRides.full"),
                                        viewPassengers: t(
                                            "driverRides.viewPassengers"
                                        ),
                                        cancelRide: t("driverRides.cancelRide"),
                                    }}
                                />
                            ) : (
                                <RideCard
                                    key={ride.id}
                                    variant="driver-past"
                                    from={ride.from}
                                    to={ride.to}
                                    datetime={formatDate(
                                        new Date(ride.date),
                                        t("home.at")
                                    )}
                                    price={ride.price}
                                    onRatePassengers={() =>
                                        navigate("/driver/rides/rate", {
                                            state: { ride },
                                        })
                                    }
                                    labels={{
                                        ratePassengers: t(
                                            "driverRides.ratePassengers"
                                        ),
                                    }}
                                />
                            );
                        })}
                </div>
            </section>
        </div>
    );
}
