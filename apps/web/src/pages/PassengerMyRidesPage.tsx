import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "../lib/router-compat";
import {
    PassengerNavbar,
    RideCard,
    Button,
    RateDriverModal,
} from "@waymate/ui";
import type { Language } from "@waymate/ui";
import i18n from "../i18n";

type PassengerMyRidesPageProps = {
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

function formatRideDate(date: Date, atLabel: string): string {
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

type UpcomingRide = {
    id: number;
    from: string;
    to: string;
    date: Date | string;
    price: number;
    driverName: string;
    driverRating: number;
    seatsLeft: number;
    status: "pending" | "confirmed";
};

const UPCOMING_RIDES: UpcomingRide[] = [
    {
        id: 1,
        from: "Martin",
        to: "Brno",
        date: new Date(2026, 2, 15, 8, 0),
        price: 10,
        driverName: "Sarah Johnson",
        driverRating: 4.9,
        seatsLeft: 2,
        status: "pending",
    },
    {
        id: 2,
        from: "Brno",
        to: "Martin",
        date: new Date(2026, 2, 21, 10, 0),
        price: 12,
        driverName: "Mike Chen",
        driverRating: 4.8,
        seatsLeft: 1,
        status: "confirmed",
    },
];

const PAST_RIDES = [
    {
        id: 3,
        from: "Martin",
        to: "Brno",
        date: new Date(2026, 2, 15, 8, 0),
        price: 10,
        driverName: "Sarah Johnson",
        driverRating: 4.9,
    },
    {
        id: 4,
        from: "Brno",
        to: "Martin",
        date: new Date(2026, 2, 21, 10, 0),
        price: 12,
        driverName: "Mike Chen",
        driverRating: 4.8,
    },
];

export function PassengerMyRidesPage({
    language,
    theme,
    onLanguageChange,
    onThemeToggle,
    userName,
    userEmail,
}: PassengerMyRidesPageProps) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const [tab, setTab] = useState("upcoming");
    const [ratingModalOpen, setRatingModalOpen] = useState(false);
    const [ratingDriverName, setRatingDriverName] = useState("");
    const [upcomingRides, setUpcomingRides] = useState(UPCOMING_RIDES);

    useEffect(() => {
        const booked = (
            location.state as { bookedRide?: (typeof UPCOMING_RIDES)[0] } | null
        )?.bookedRide;
        if (booked) {
            setUpcomingRides((prev) => {
                const alreadyExists = prev.some((r) => r.id === booked.id);
                return alreadyExists ? prev : [booked, ...prev];
            });
            setTab("upcoming");
            window.history.replaceState({}, "");
        }
    }, [location.state]);

    const rideLabels = {
        seatsLeft: (count: number) => t("myRides.seatsLeft", { count }),
        pendingConfirmation: t("myRides.pendingConfirmation"),
        cancelBooking: t("myRides.cancelBooking"),
        rateDriver: t("myRides.rateDriver"),
    };

    return (
        <div
            data-theme={theme}
            className="min-h-screen bg-(--color-bg)"
        >
            <PassengerNavbar
                activeTab="my-rides"
                language={language}
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
                onRatingsClick={() => navigate("/passenger/ratings")}
                onLogoutClick={() => navigate("/")}
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
                <h1 className="text-2xl font-bold text-(--color-text-primary) mb-6">
                    {t("myRides.title")}
                </h1>

                <div className="flex gap-2">
                    <Button
                        variant={tab === "upcoming" ? "black" : "secondary"}
                        onClick={() => setTab("upcoming")}
                    >
                        {t("myRides.upcoming")}
                    </Button>
                    <Button
                        variant={tab === "past" ? "black" : "secondary"}
                        onClick={() => setTab("past")}
                    >
                        {t("myRides.past")}
                    </Button>
                </div>

                <div className="flex flex-col gap-4 mt-6">
                    {tab === "upcoming" &&
                        upcomingRides.map((ride) => (
                            <RideCard
                                key={ride.id}
                                variant="passenger-upcoming"
                                from={ride.from}
                                to={ride.to}
                                datetime={formatRideDate(
                                    typeof ride.date === "string"
                                        ? new Date(ride.date)
                                        : ride.date,
                                    t("home.at")
                                )}
                                price={ride.price}
                                driverName={ride.driverName}
                                driverRating={ride.driverRating}
                                seatsLeft={ride.seatsLeft}
                                status={ride.status}
                                onCancelBooking={() => {}}
                                labels={rideLabels}
                            />
                        ))}

                    {tab === "past" &&
                        PAST_RIDES.map((ride) => (
                            <RideCard
                                key={ride.id}
                                variant="passenger-past"
                                from={ride.from}
                                to={ride.to}
                                datetime={formatRideDate(
                                    typeof ride.date === "string"
                                        ? new Date(ride.date)
                                        : ride.date,
                                    t("home.at")
                                )}
                                price={ride.price}
                                driverName={ride.driverName}
                                driverRating={ride.driverRating}
                                onRateDriver={() => {
                                    setRatingDriverName(ride.driverName);
                                    setRatingModalOpen(true);
                                }}
                                labels={rideLabels}
                            />
                        ))}
                </div>
            </section>

            <RateDriverModal
                open={ratingModalOpen}
                onOpenChange={setRatingModalOpen}
                driverName={ratingDriverName}
                title={t("rateDriver.title")}
                submitLabel={t("rateDriver.submit")}
                placeholder={t("rateDriver.placeholder")}
                onSubmit={({ rating, review }) => {
                    console.log("Rating submitted", {
                        driverName: ratingDriverName,
                        rating,
                        review,
                    });
                    setRatingModalOpen(false);
                }}
            />
        </div>
    );
}
