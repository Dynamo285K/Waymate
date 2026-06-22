import { useTranslation } from "react-i18next";
import { useNavigate } from "@tanstack/react-router";
import type { Language } from "../../../components/controls/LanguageSwitcher";
import { toUiLanguage } from "../../../lib/language";
import { useLogout } from "../../../hooks/shared/useLogout";

export function useAdminNavbarProps(params: {
    activeTab?: "dashboard" | "rides" | "users" | "reviews" | "reports";
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
        onLogoClick: () => navigate({ to: "/admin" }),
        onDashboardClick: () => navigate({ to: "/admin" }),
        onRidesClick: () => navigate({ to: "/admin/rides" }),
        onUsersClick: () => navigate({ to: "/admin/users" }),
        onReviewsClick: () => navigate({ to: "/admin/reviews" }),
        onReportsClick: () => navigate({ to: "/admin/reports" }),
        onLogoutClick: logout,
        labels: {
            adminRole: t("admin.adminRole"),
            dashboard: t("admin.dashboard"),
            rides: t("admin.rides"),
            users: t("admin.users"),
            reviews: t("admin.reviewsTab"),
            reports: t("admin.reports.tab"),
            logout: t("admin.logout"),
        },
    };
}
