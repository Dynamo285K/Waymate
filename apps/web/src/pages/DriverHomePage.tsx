import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "../lib/router-compat";
import {
    DriverNavbar,
    RideCard,
    RideRequestCard,
    FeatureCard,
} from "waymate-ui";
import type { Language } from "waymate-ui";
import i18n from "../i18n";

type DriverHomePageProps = {
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

const UPCOMING_RIDES = [
    {
        id: 1,
        from: "Martin",
        to: "Brno",
        date: new Date(2026, 2, 15, 8, 0),
        price: 10,
        seatsLeft: 2,
    },
    {
        id: 2,
        from: "Brno",
        to: "Martin",
        date: new Date(2026, 2, 21, 10, 0),
        price: 12,
        seatsLeft: 1,
    },
    {
        id: 3,
        from: "Brno",
        to: "Martin",
        date: new Date(2026, 2, 21, 10, 0),
        price: 12,
        seatsLeft: 1,
    },
];

const RIDE_REQUESTS = [
    {
        id: 1,
        name: "Bob Smith",
        rating: 4.9,
        seatsRequired: 1,
        from: "Martin",
        to: "Brno",
        date: new Date(2026, 2, 15, 8, 0),
    },
    {
        id: 2,
        name: "Alice Brown",
        rating: 5,
        seatsRequired: 2,
        from: "Martin",
        to: "Brno",
        date: new Date(2026, 2, 15, 8, 0),
    },
    {
        id: 3,
        name: "Carol Davis",
        rating: 4.8,
        seatsRequired: 3,
        from: "Martin",
        to: "Brno",
        date: new Date(2026, 2, 15, 8, 0),
    },
];

function IconBox({
    bg,
    color,
    children,
}: {
    bg: string;
    color: string;
    children: React.ReactNode;
}) {
    return (
        <div
            className={`w-full h-full ${bg} ${color} rounded-xl flex items-center justify-center`}
        >
            {children}
        </div>
    );
}

function ShieldIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
    );
}
function CoinsIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle
                cx="8"
                cy="8"
                r="6"
            />
            <path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
            <path d="M7 6h1v4" />
            <path d="m16.71 13.88.7.71-2.82 2.82" />
        </svg>
    );
}
function LeafIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
            <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
        </svg>
    );
}
function MessageIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
    );
}
function BoltIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
    );
}
function StarIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
    );
}

export function DriverHomePage({
    language,
    theme,
    onLanguageChange,
    onThemeToggle,
    userName,
    userEmail,
}: DriverHomePageProps) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [requests, setRequests] = useState(RIDE_REQUESTS);

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

    const rideLabels = {
        seatsLeft: (count: number) =>
            t("home.availableRides.seatsLeft", { count }),
        viewPassengers: "",
        cancelRide: t("driver.home.cancelRide"),
    };

    const requestLabels = {
        seatsRequired: (count: number) =>
            t("driver.home.seatsRequired", { count }),
        accept: t("driver.home.accept"),
        decline: t("driver.home.decline"),
    };

    return (
        <div
            data-theme={theme}
            className="min-h-screen bg-(--color-bg)"
        >
            <DriverNavbar
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
                onOfferRideClick={() => navigate("/driver/offer")}
                onMyRidesClick={() => navigate("/driver/rides")}
                onRideRequestsClick={() => navigate("/driver/requests")}
                onChatClick={() => navigate("/driver/chat")}
                onMessagesClick={() => navigate("/driver/chat")}
                onProfileClick={() => navigate("/driver/profile")}
                onRatingsClick={() => navigate("/driver/ratings")}
                onLogoutClick={() => navigate("/")}
                labels={navbarLabels}
            />

            {/* Hero */}
            <section className="flex flex-col items-center pt-16 sm:pt-24 pb-12 px-4 text-center">
                <h1 className="text-4xl sm:text-5xl font-black text-(--color-text-primary) tracking-tight">
                    {t("driver.home.title")}
                </h1>
                <p className="mt-3 text-lg text-(--color-text-secondary)">
                    {t("driver.home.subtitle")}
                </p>
                <button
                    onClick={() => navigate("/driver/offer")}
                    className="mt-8 border-2 border-(--color-primary) text-(--color-primary) rounded-full px-8 py-3 font-semibold text-base hover:bg-green-50 transition-colors flex items-center gap-2"
                >
                    {t("driver.home.createRide")}{" "}
                    <span className="text-xl leading-none">+</span>
                </button>
            </section>

            <div className="w-full px-4 sm:max-w-3xl sm:mx-auto sm:px-8 flex flex-col gap-10 pb-12">
                {/* Upcoming Rides */}
                <div>
                    <h2 className="text-xl font-bold text-(--color-text-primary) mb-4">
                        {t("driver.home.upcomingRides")}
                    </h2>
                    <div className="flex flex-col gap-3">
                        {UPCOMING_RIDES.map((ride) => (
                            <RideCard
                                key={ride.id}
                                variant="driver-upcoming"
                                from={ride.from}
                                to={ride.to}
                                datetime={formatDate(ride.date, t("home.at"))}
                                price={ride.price}
                                seatsLeft={ride.seatsLeft}
                                onViewPassengers={() => {}}
                                onCancelRide={() => {}}
                                labels={rideLabels}
                            />
                        ))}
                    </div>
                    <div className="flex justify-center mt-6">
                        <button
                            onClick={() => navigate("/driver/rides")}
                            className="border border-(--color-primary) text-(--color-primary) rounded-full px-6 py-2.5 font-medium text-sm hover:bg-green-50 transition-colors"
                        >
                            {t("driver.home.viewAllRides")}
                        </button>
                    </div>
                </div>
            </div>

            {/* Ride Requests */}
            <div className="border-t border-(--color-border)">
                <div className="w-full px-4 sm:max-w-3xl sm:mx-auto sm:px-8 py-10">
                    <h2 className="text-xl font-bold text-(--color-text-primary)">
                        {t("driver.home.rideRequests")}
                    </h2>
                    <p className="text-(--color-text-secondary) text-sm mt-1 mb-6">
                        {t("driver.home.rideRequestsSubtitle")}
                    </p>
                    <div className="flex flex-col gap-3">
                        {requests.map((req) => (
                            <RideRequestCard
                                key={req.id}
                                name={req.name}
                                rating={req.rating}
                                seatsRequired={req.seatsRequired}
                                from={req.from}
                                to={req.to}
                                datetime={formatDate(req.date, t("home.at"))}
                                onAccept={() =>
                                    setRequests((prev) =>
                                        prev.filter((r) => r.id !== req.id)
                                    )
                                }
                                onDecline={() =>
                                    setRequests((prev) =>
                                        prev.filter((r) => r.id !== req.id)
                                    )
                                }
                                labels={requestLabels}
                            />
                        ))}
                    </div>
                    <div className="flex justify-center mt-6">
                        <button
                            onClick={() => navigate("/driver/requests")}
                            className="border border-(--color-primary) text-(--color-primary) rounded-full px-6 py-2.5 font-medium text-sm hover:bg-green-50 transition-colors"
                        >
                            {t("driver.home.viewAllRequests")}
                        </button>
                    </div>
                </div>
            </div>

            {/* Features */}
            <section className="bg-(--color-background) border-t border-(--color-border) py-16 px-4">
                <div className="w-full sm:max-w-5xl sm:mx-auto text-center">
                    <h2 className="text-2xl sm:text-4xl font-black text-(--color-text-primary)">
                        {t("home.features.title")}
                    </h2>
                    <p className="mt-2 text-(--color-text-secondary)">
                        {t("home.features.subtitle")}
                    </p>
                    <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-left">
                        <FeatureCard
                            icon={
                                <IconBox
                                    bg="bg-green-100"
                                    color="text-green-700"
                                >
                                    <ShieldIcon />
                                </IconBox>
                            }
                            title={t("home.features.verifiedDrivers.title")}
                            description={t(
                                "home.features.verifiedDrivers.description"
                            )}
                        />
                        <FeatureCard
                            icon={
                                <IconBox
                                    bg="bg-green-100"
                                    color="text-green-700"
                                >
                                    <CoinsIcon />
                                </IconBox>
                            }
                            title={t("home.features.fairPricing.title")}
                            description={t(
                                "home.features.fairPricing.description"
                            )}
                        />
                        <FeatureCard
                            icon={
                                <IconBox
                                    bg="bg-purple-100"
                                    color="text-purple-600"
                                >
                                    <LeafIcon />
                                </IconBox>
                            }
                            title={t("home.features.ecoFriendly.title")}
                            description={t(
                                "home.features.ecoFriendly.description"
                            )}
                        />
                        <FeatureCard
                            icon={
                                <IconBox
                                    bg="bg-purple-100"
                                    color="text-purple-600"
                                >
                                    <MessageIcon />
                                </IconBox>
                            }
                            title={t("home.features.directChat.title")}
                            description={t(
                                "home.features.directChat.description"
                            )}
                        />
                        <FeatureCard
                            icon={
                                <IconBox
                                    bg="bg-yellow-100"
                                    color="text-yellow-600"
                                >
                                    <BoltIcon />
                                </IconBox>
                            }
                            title={t("home.features.fastBooking.title")}
                            description={t(
                                "home.features.fastBooking.description"
                            )}
                        />
                        <FeatureCard
                            icon={
                                <IconBox
                                    bg="bg-pink-100"
                                    color="text-pink-600"
                                >
                                    <StarIcon />
                                </IconBox>
                            }
                            title={t("home.features.ratings.title")}
                            description={t("home.features.ratings.description")}
                        />
                    </div>
                </div>
            </section>
        </div>
    );
}
