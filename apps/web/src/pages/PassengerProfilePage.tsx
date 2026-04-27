import { useTranslation } from "react-i18next";
import { useNavigate } from "../lib/router-compat";
import { PassengerNavbar, ProfileHeroCard, RideCard } from "@waymate/ui";
import type { Language } from "@waymate/ui";
import { formatRideDate } from "../lib/date-format";

type PassengerProfilePageProps = {
    language: Language;
    theme: "light" | "dark";
    onLanguageChange: (lang: Language) => void;
    onThemeToggle: () => void;
    userName?: string;
    userEmail?: string;
};

const UPCOMING_RIDES = [
    {
        id: 1,
        from: "Martin",
        to: "Brno",
        date: new Date(2026, 2, 15, 8, 0),
        price: 10,
        seatsLeft: 2,
        driverName: "Martin Kováč",
        driverRating: 4.9,
        status: "confirmed" as const,
    },
    {
        id: 2,
        from: "Brno",
        to: "Martin",
        date: new Date(2026, 2, 21, 10, 0),
        price: 12,
        seatsLeft: 1,
        driverName: "Eva Szabóová",
        driverRating: 4.8,
        status: "pending" as const,
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
                    onEditProfileClick={() =>
                        navigate("/profile/edit", {
                            state: { role: "passenger" },
                        })
                    }
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

                {/* My Upcoming Rides */}
                <div className="flex flex-col gap-4">
                    <h2 className="text-lg font-bold text-(--color-text-primary)">
                        {t("profile.myUpcomingRides")}
                    </h2>
                    {UPCOMING_RIDES.map((ride) => (
                        <RideCard
                            key={ride.id}
                            variant="passenger-upcoming"
                            from={ride.from}
                            to={ride.to}
                            datetime={formatRideDate(ride.date, t("home.at"))}
                            price={ride.price}
                            seatsLeft={ride.seatsLeft}
                            driverName={ride.driverName}
                            driverRating={ride.driverRating}
                            status={ride.status}
                            onCancelBooking={() => {}}
                            labels={{
                                seatsLeft: (count) =>
                                    t("home.availableRides.seatsLeft", {
                                        count,
                                    }),
                                pendingConfirmation: t(
                                    "myRides.pendingConfirmation"
                                ),
                                cancelBooking: t("myRides.cancelBooking"),
                            }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
