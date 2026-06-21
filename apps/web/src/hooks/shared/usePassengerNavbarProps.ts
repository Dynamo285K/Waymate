import { useTranslation } from "react-i18next";
import { useNavigate } from "@tanstack/react-router";
import type { Language } from "../../components/controls/LanguageSwitcher";
import { toUiLanguage } from "../../lib/language";
import { useLogout } from "./useLogout";
import { useUnreadCount } from "../../features/chat/hooks/useUnreadCount";

export function usePassengerNavbarProps(params: {
    activeTab?: "find-ride" | "my-rides" | "chat";
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
        role: "passenger" as const,
        onRoleChange: (r: "passenger" | "driver") =>
            r === "driver" && navigate({ to: "/driver" }),
        onLogoClick: () => navigate({ to: "/passenger" }),
        onFindRideClick: () => navigate({ to: "/passenger" }),
        onMyRidesClick: () => navigate({ to: "/passenger/rides" }),
        onChatClick: () => navigate({ to: "/passenger/chat" }),
        onMessagesClick: () => navigate({ to: "/passenger/chat" }),
        onProfileClick: () => navigate({ to: "/passenger/profile" }),
        onRatingsClick: () => navigate({ to: "/passenger/ratings" }),
        onLogoutClick: logout,
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
}
