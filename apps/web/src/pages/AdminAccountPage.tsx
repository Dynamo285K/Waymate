import { useTranslation } from "react-i18next";
import { useNavigate } from "../lib/router-compat";
import { AdminNavbar, Avatar, Button } from "@waymate/ui";
import type { Language } from "@waymate/ui";

type AdminAccountPageProps = {
    language: Language;
    theme: "light" | "dark";
    onLanguageChange: (lang: Language) => void;
    onThemeToggle: () => void;
    userName?: string;
    userEmail?: string;
};

export function AdminAccountPage({
    language,
    theme,
    onLanguageChange,
    onThemeToggle,
    userName = "Admin",
    userEmail = "admin@waymate.com",
}: AdminAccountPageProps) {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const navLabels = {
        adminRole: t("admin.adminRole"),
        dashboard: t("admin.dashboard"),
        rides: t("admin.rides"),
        users: t("admin.users"),
        reports: t("admin.reports"),
        account: t("admin.account"),
        settings: t("admin.settings"),
        logout: t("admin.logout"),
    };

    return (
        <div
            data-theme={theme}
            className="min-h-screen bg-(--color-bg)"
        >
            <AdminNavbar
                language={language}
                onLanguageChange={onLanguageChange}
                theme={theme}
                onThemeToggle={onThemeToggle}
                userName={userName}
                userEmail={userEmail}
                onLogoClick={() => navigate("/admin")}
                onDashboardClick={() => navigate("/admin")}
                onRidesClick={() => navigate("/admin/rides")}
                onUsersClick={() => navigate("/admin/users")}
                onReportsClick={() => navigate("/admin/reports")}
                onProfileClick={() => navigate("/admin/account")}
                onLogoutClick={() => navigate("/")}
                labels={navLabels}
            />

            <div className="w-full px-4 sm:max-w-3xl sm:mx-auto sm:px-8 py-8 sm:py-12">
                <div className="bg-(--color-card) rounded-2xl border border-(--color-border) shadow-md p-8 flex items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <Avatar
                            name={userName}
                            size="lg"
                        />
                        <div>
                            <h2 className="text-2xl font-bold text-(--color-text-primary)">
                                {userName}
                            </h2>
                            <p className="text-(--color-text-secondary) mt-0.5">
                                {userEmail}
                            </p>
                        </div>
                    </div>
                    <Button
                        onClick={() =>
                            navigate("/profile/edit", {
                                state: { role: "admin" },
                            })
                        }
                    >
                        {t("profile.editProfile")} ✎
                    </Button>
                </div>
            </div>
        </div>
    );
}
