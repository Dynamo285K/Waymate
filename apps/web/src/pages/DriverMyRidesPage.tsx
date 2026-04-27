import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "../lib/router-compat";
import { DriverNavbar, RideCard, Button } from "waymate-ui";
import type { Language } from "waymate-ui";
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

const UPCOMING = [
    {
        id: "u1",
        from: "Martin",
        to: "Brno",
        date: new Date(2026, 2, 15, 8, 0),
        price: 10,
        seatsLeft: 2 as number | "full",
    },
    {
        id: "u2",
        from: "Brno",
        to: "Martin",
        date: new Date(2026, 2, 21, 10, 0),
        price: 12,
        seatsLeft: "full" as number | "full",
    },
];

const PAST = [
    {
        id: "p1",
        from: "Martin",
        to: "Brno",
        date: new Date(2026, 2, 15, 8, 0),
        price: 10,
    },
    {
        id: "p2",
        from: "Brno",
        to: "Martin",
        date: new Date(2026, 2, 21, 10, 0),
        price: 12,
    },
];

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
                    {tab === "upcoming" &&
                        UPCOMING.map((ride) => (
                            <RideCard
                                key={ride.id}
                                variant="driver-upcoming"
                                from={ride.from}
                                to={ride.to}
                                datetime={formatDate(ride.date, t("home.at"))}
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
                                        t("driverRides.seatsLeft", { count }),
                                    full: t("driverRides.full"),
                                    viewPassengers: t(
                                        "driverRides.viewPassengers"
                                    ),
                                    cancelRide: t("driverRides.cancelRide"),
                                }}
                            />
                        ))}

                    {tab === "past" &&
                        PAST.map((ride) => (
                            <RideCard
                                key={ride.id}
                                variant="driver-past"
                                from={ride.from}
                                to={ride.to}
                                datetime={formatDate(ride.date, t("home.at"))}
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
                        ))}
                </div>
            </section>
        </div>
    );
}
