import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { PassengerNavbar, RatingSummaryCard, RatingCard } from "waymate-ui";
import type { Language } from "waymate-ui";

type PassengerRatingsPageProps = {
    language: Language;
    theme: "light" | "dark";
    onLanguageChange: (lang: Language) => void;
    onThemeToggle: () => void;
    userName?: string;
    userEmail?: string;
};

const RATINGS = [
    {
        id: 1,
        name: "Bob Smith",
        from: "Martin",
        to: "Brno",
        rating: 4,
        review: "Good driver, safe and comfortable ride. Music was a bit loud though.",
    },
    {
        id: 2,
        name: "Alice Brown",
        from: "Brno",
        to: "Bratislava",
        rating: 5,
        review: "Excellent communication and very respectful. Perfect passenger!",
    },
    {
        id: 3,
        name: "Carol Davis",
        from: "Brno",
        to: "Praha",
        rating: 4,
        review: "Nice person, pleasant conversation during the ride.",
    },
];

export function PassengerRatingsPage({
    language,
    theme,
    onLanguageChange,
    onThemeToggle,
    userName,
    userEmail,
}: PassengerRatingsPageProps) {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const avgRating = +(
        RATINGS.reduce((s, r) => s + r.rating, 0) / RATINGS.length
    ).toFixed(1);

    return (
        <div
            data-theme={theme}
            className="min-h-screen bg-(--color-bg)"
        >
            <PassengerNavbar
                activeTab="find-ride"
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
                onRatingsClick={() => navigate("/passenger/ratings")}
                onProfileClick={() => navigate("/passenger/profile")}
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
                <button
                    onClick={() => navigate("/passenger/profile")}
                    className="text-(--color-text-secondary) text-sm mb-4 hover:text-(--color-text-primary) transition-colors"
                >
                    {t("profile.backToProfile")}
                </button>

                <h1 className="text-2xl font-bold text-(--color-text-primary) mb-6">
                    {t("ratings.title")}
                </h1>

                <RatingSummaryCard
                    rating={avgRating}
                    totalRatings={RATINGS.length}
                    totalRatingsLabel={t("ratings.totalRatings")}
                />

                <div className="flex flex-col gap-4 mt-6">
                    {RATINGS.map((r) => (
                        <RatingCard
                            key={r.id}
                            name={r.name}
                            from={r.from}
                            to={r.to}
                            rating={r.rating}
                            review={r.review}
                        />
                    ))}
                </div>
            </section>
        </div>
    );
}
