import { useTranslation } from "react-i18next";
import { useNavigate } from "../lib/router-compat";
import { PassengerNavbar } from "@waymate/ui";
import type { Language } from "@waymate/ui";
import { HomeContent } from "../components/HomeContent";
import { useLogout } from "../hooks/useLogout";

type PassengerHomePageProps = {
    language: Language;
    theme: "light" | "dark";
    onLanguageChange: (lang: Language) => void;
    onThemeToggle: () => void;
    userName?: string;
    userEmail?: string;
};

export function PassengerHomePage({
    language,
    theme,
    onLanguageChange,
    onThemeToggle,
    userName,
    userEmail,
}: PassengerHomePageProps) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const logout = useLogout();

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
                onProfileClick={() => navigate("/passenger/profile")}
                onRatingsClick={() => navigate("/passenger/ratings")}
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
            <HomeContent
                language={language}
                onBook={(ride) =>
                    navigate("/passenger/rides", {
                        state: {
                            bookedRide: {
                                id: Date.now(),
                                from: ride.from,
                                to: ride.to,
                                date: ride.date.toISOString(),
                                price: ride.price,
                                driverName: ride.driverName,
                                driverRating: ride.driverRating,
                                seatsLeft: ride.seatsLeft,
                                status: "pending",
                            },
                        },
                    })
                }
                onSearch={(from, to, date) => {
                    const params = new URLSearchParams();
                    if (from) params.set("from", from);
                    if (to) params.set("to", to);
                    if (date) params.set("date", date.toISOString());
                    navigate(`/passenger/rides/search?${params.toString()}`);
                }}
                onViewAllRides={() => navigate("/passenger/rides/search")}
            />
        </div>
    );
}
