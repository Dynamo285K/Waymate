import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
    PassengerNavbar,
    ProfileHeroCard,
    CarCard,
    RideCard,
    Button,
} from "waymate-ui";
import type { Language } from "waymate-ui";
import i18n from "../i18n";

type PassengerProfilePageProps = {
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
];

export function PassengerProfilePage({
    language,
    theme,
    onLanguageChange,
    onThemeToggle,
    userName = "Tomáš Olbert",
    userEmail = "najviacpracujuci@gmail.com",
}: PassengerProfilePageProps) {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const navbarProps = {
        activeTab: "find-ride" as const,
        language,
        onLanguageChange,
        role: "passenger" as const,
        onRoleChange: (r: "passenger" | "driver") =>
            r === "driver" && navigate("/driver"),
        theme,
        onThemeToggle,
        userName,
        userEmail,
        onLogoClick: () => navigate("/passenger"),
        onFindRideClick: () => navigate("/passenger"),
        onMyRidesClick: () => navigate("/passenger/rides"),
        onChatClick: () => navigate("/passenger/chat"),
        onMessagesClick: () => navigate("/passenger/chat"),
        onRatingsClick: () => navigate("/passenger/ratings"),
        onProfileClick: () => navigate("/passenger/profile"),
        onLogoutClick: () => navigate("/"),
        labels: {
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
        },
    };

    return (
        <div
            data-theme={theme}
            className="min-h-screen bg-(--color-bg)"
        >
            <PassengerNavbar {...navbarProps} />

            <div className="w-full px-4 sm:max-w-5xl sm:mx-auto sm:px-8 py-8 sm:py-12 flex flex-col gap-6">
                {/* Hero card */}
                <ProfileHeroCard
                    name={userName}
                    email={userEmail}
                    rating="4.9"
                    memberSince="2026"
                    onViewRatingsClick={() => navigate("/passenger/ratings")}
                    onEditProfileClick={() => {}}
                    labels={{
                        viewAllRatings: t("profile.viewAllRatings"),
                        memberSince: t("profile.memberSince"),
                        editProfile: t("profile.editProfile"),
                    }}
                />

                {/* About me */}
                <div className="bg-(--color-card) rounded-2xl p-6 border border-(--color-border)">
                    <h2 className="text-base font-semibold text-(--color-text-primary) mb-3">
                        {t("profile.aboutMe")}
                    </h2>
                    <p className="text-(--color-text-secondary) text-sm leading-relaxed">
                        Easygoing traveler who enjoys meeting new people on the
                        road. Reliable, communicative, and always respectful
                        during rides.
                    </p>
                </div>

                {/* Two-column: rides + cars */}
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* My Upcoming Rides */}
                    <div className="flex-1 flex flex-col gap-4">
                        <h2 className="text-lg font-bold text-(--color-text-primary)">
                            {t("profile.myUpcomingRides")}
                        </h2>
                        {UPCOMING_RIDES.map((ride) => (
                            <RideCard
                                key={ride.id}
                                variant="driver-upcoming"
                                from={ride.from}
                                to={ride.to}
                                datetime={formatRideDate(
                                    ride.date,
                                    t("home.at")
                                )}
                                price={ride.price}
                                seatsLeft={ride.seatsLeft}
                                onViewPassengers={() => {}}
                                onCancelRide={() => {}}
                                labels={{
                                    seatsLeft: (count) =>
                                        t("home.availableRides.seatsLeft", {
                                            count,
                                        }),
                                    viewPassengers: t("profile.manage"),
                                    cancelRide: t("profile.cancelRide"),
                                }}
                            />
                        ))}
                    </div>

                    {/* My Cars */}
                    <div className="lg:w-72 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-(--color-text-primary)">
                                {t("profile.myCars")}
                            </h2>
                            <Button onClick={() => {}}>
                                {t("profile.addCar")}
                            </Button>
                        </div>
                        <CarCard model="Skoda Fabia" />
                    </div>
                </div>
            </div>
        </div>
    );
}
