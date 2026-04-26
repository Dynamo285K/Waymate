import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom";
import { DriverNavbar, RatePassengerCard, StatCard } from "waymate-ui";
import type { Language } from "waymate-ui";

type DriverRatePassengersPageProps = {
    language: Language;
    theme: "light" | "dark";
    onLanguageChange: (lang: Language) => void;
    onThemeToggle: () => void;
    userName?: string;
    userEmail?: string;
};

const PASSENGERS = [
    { id: 1, name: "Bob Smith" },
    { id: 2, name: "Alice Brown" },
    { id: 3, name: "Carol Davis" },
];

function MapIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
            <line
                x1="9"
                y1="3"
                x2="9"
                y2="18"
            />
            <line
                x1="15"
                y1="6"
                x2="15"
                y2="21"
            />
        </svg>
    );
}
function DollarIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <line
                x1="12"
                y1="1"
                x2="12"
                y2="23"
            />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
    );
}
function UsersIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle
                cx="9"
                cy="7"
                r="4"
            />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    );
}
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

export function DriverRatePassengersPage({
    language,
    theme,
    onLanguageChange,
    onThemeToggle,
    userName,
    userEmail,
}: DriverRatePassengersPageProps) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const ride = (
        location.state as { ride?: { from: string; to: string } } | null
    )?.ride;

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
                <button
                    onClick={() => navigate("/driver/rides")}
                    className="text-(--color-text-secondary) text-sm mb-4 hover:text-(--color-text-primary) transition-colors"
                >
                    {t("driverRides.backToMyRides")}
                </button>

                <h1 className="text-2xl font-bold text-(--color-text-primary) mb-2">
                    {t("driverRides.ratePassengersTitle")}
                </h1>

                {ride && (
                    <p className="text-(--color-text-secondary) text-sm mb-6">
                        {ride.from} → {ride.to}
                    </p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    <StatCard
                        icon={
                            <IconBox
                                bg="bg-green-100"
                                color="text-green-700"
                            >
                                <MapIcon />
                            </IconBox>
                        }
                        value="230km"
                        label={
                            t("driverRides.kmTraveled", { km: 230 })
                                .replace("230km", "")
                                .trim() || "traveled"
                        }
                    />
                    <StatCard
                        icon={
                            <IconBox
                                bg="bg-pink-100"
                                color="text-pink-600"
                            >
                                <DollarIcon />
                            </IconBox>
                        }
                        value="36€"
                        label={
                            t("driverRides.earned", { amount: 36 })
                                .replace("36€", "")
                                .trim() || "earned"
                        }
                    />
                    <StatCard
                        icon={
                            <IconBox
                                bg="bg-purple-100"
                                color="text-purple-600"
                            >
                                <UsersIcon />
                            </IconBox>
                        }
                        value={String(PASSENGERS.length)}
                        label={t("driverRides.passengers")}
                    />
                </div>

                <div className="flex flex-col gap-4">
                    {PASSENGERS.map((p) => (
                        <RatePassengerCard
                            key={p.id}
                            name={p.name}
                            onSubmit={(rating, review) =>
                                console.log(p.name, rating, review)
                            }
                            labels={{
                                placeholder: t("driverRides.writeReview"),
                                submitRating: t("driverRides.submitRating"),
                            }}
                        />
                    ))}
                </div>
            </section>
        </div>
    );
}
