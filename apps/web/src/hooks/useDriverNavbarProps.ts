import { useTranslation } from "react-i18next";
import { useNavigate } from "../lib/router-compat";
import type { Language } from "@waymate/ui";

export function useDriverNavbarProps(params: {
    activeTab?: "offer-ride" | "my-rides" | "ride-requests" | "chat";
    language: Language;
    onLanguageChange: (lang: Language) => void;
    theme: "light" | "dark";
    onThemeToggle: () => void;
    userName?: string;
    userEmail?: string;
}) {
    const { t } = useTranslation();
    const navigate = useNavigate();

    return {
        ...params,
        role: "driver" as const,
        onRoleChange: (r: "passenger" | "driver") =>
            r === "passenger" && navigate("/passenger"),
        onLogoClick: () => navigate("/driver"),
        onOfferRideClick: () => navigate("/driver/offer"),
        onMyRidesClick: () => navigate("/driver/rides"),
        onRideRequestsClick: () => navigate("/driver/requests"),
        onChatClick: () => navigate("/driver/chat"),
        onMessagesClick: () => navigate("/driver/chat"),
        onProfileClick: () => navigate("/driver/profile"),
        onRatingsClick: () => navigate("/driver/ratings"),
        onLogoutClick: () => navigate("/"),
        labels: {
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
        },
    };
}
