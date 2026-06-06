import { useTranslation } from "react-i18next";
import { useNavigate } from "../../../lib/router-compat";
import type { Language } from "../../../components/controls/LanguageSwitcher";
import { toUiLanguage } from "../../../lib/language";
import { useLogout } from "../../../hooks/useLogout";

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
        onLogoClick: () => navigate("/admin"),
        onDashboardClick: () => navigate("/admin"),
        onRidesClick: () => navigate("/admin/rides"),
        onUsersClick: () => navigate("/admin/users"),
        onReviewsClick: () => navigate("/admin/reviews"),
        onReportsClick: () => navigate("/admin/reports"),
        onLogoutClick: logout,
        labels: {
            adminRole: t("admin.adminRole"),
            dashboard: t("admin.dashboard"),
            rides: t("admin.rides"),
            users: t("admin.users"),
            reviews: t("admin.reviewsTab"),
            reports: t("admin.reports.tab"),
            settings: t("admin.settings"),
            logout: t("admin.logout"),
        },
    };
}
