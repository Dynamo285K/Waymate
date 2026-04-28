import { useTranslation } from "react-i18next";
import { useNavigate } from "../lib/router-compat";
import type { Language } from "@waymate/ui";
import { toUiLanguage } from "../lib/language";
import { useLogout } from "./useLogout";

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

    return {
        ...params,
        language: toUiLanguage(params.language),
        role: "passenger" as const,
        onRoleChange: (r: "passenger" | "driver") =>
            r === "driver" && navigate("/driver"),
        onLogoClick: () => navigate("/passenger"),
        onFindRideClick: () => navigate("/passenger"),
        onMyRidesClick: () => navigate("/passenger/rides"),
        onChatClick: () => navigate("/passenger/chat"),
        onMessagesClick: () => navigate("/passenger/chat"),
        onProfileClick: () => navigate("/passenger/profile"),
        onRatingsClick: () => navigate("/passenger/ratings?view=authored"),
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
