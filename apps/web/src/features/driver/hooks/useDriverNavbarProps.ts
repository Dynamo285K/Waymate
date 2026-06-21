import { useTranslation } from "react-i18next";
import { useNavigate } from "@tanstack/react-router";
import type { Language } from "../../../components/controls/LanguageSwitcher";
import { toUiLanguage } from "../../../lib/language";
import { useLogout } from "../../../hooks/shared/useLogout";
import { useUnreadCount } from "../../chat/hooks/useUnreadCount";

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
    const logout = useLogout();
    const chatBadge = useUnreadCount();

    return {
        ...params,
        chatBadge,
        language: toUiLanguage(params.language),
        role: "driver" as const,
        onRoleChange: (r: "passenger" | "driver") =>
            r === "passenger" && navigate({ to: "/passenger" }),
        onLogoClick: () => navigate({ to: "/driver" }),
        onOfferRideClick: () => navigate({ to: "/driver/offer" }),
        onMyRidesClick: () => navigate({ to: "/driver/rides" }),
        onRideRequestsClick: () => navigate({ to: "/driver/requests" }),
        onChatClick: () => navigate({ to: "/driver/chat" }),
        onMessagesClick: () => navigate({ to: "/driver/chat" }),
        onProfileClick: () => navigate({ to: "/driver/profile" }),
        onRatingsClick: () => navigate({ to: "/driver/ratings" }),
        onLogoutClick: logout,
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
