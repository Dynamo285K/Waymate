import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AuthNavbar, Button } from "waymate-ui";
import type { Language } from "waymate-ui";
import { HomeContent } from "../components/HomeContent";

type HomePageProps = {
    language: Language;
    theme: "light" | "dark";
    onLanguageChange: (lang: Language) => void;
    onThemeToggle: () => void;
    onLogin?: () => void;
    onRegister?: () => void;
    onLogoClick?: () => void;
    onSearch?: (from: string, to: string, date: Date | undefined) => void;
    onViewAllRides?: () => void;
};

export function HomePage({
    language,
    theme,
    onLanguageChange,
    onThemeToggle,
    onLogin,
    onRegister,
    onLogoClick,
    onSearch,
    onViewAllRides,
}: HomePageProps) {
    const { t } = useTranslation();
    const [showGuestModal, setShowGuestModal] = useState(false);

    return (
        <div
            data-theme={theme}
            className="min-h-screen bg-(--color-bg)"
        >
            <AuthNavbar
                language={language}
                onLanguageChange={onLanguageChange}
                theme={theme}
                onThemeToggle={onThemeToggle}
                onLogin={onLogin}
                onRegister={onRegister}
                onLogoClick={onLogoClick}
                labels={{
                    login: t("home.navbar.login"),
                    register: t("home.navbar.register"),
                }}
            />
            <HomeContent
                language={language}
                onSearch={onSearch}
                onViewAllRides={onViewAllRides}
                onBook={() => setShowGuestModal(true)}
            />

            {showGuestModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={() => setShowGuestModal(false)}
                    />
                    <div className="relative bg-(--color-card) rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center flex flex-col gap-4">
                        <div className="text-4xl">🔒</div>
                        <h2 className="text-xl font-bold text-(--color-text-primary)">
                            {t("bookGuest.title")}
                        </h2>
                        <p className="text-(--color-text-secondary) text-sm">
                            {t("bookGuest.message")}
                        </p>
                        <div className="flex gap-3 mt-2">
                            <Button
                                variant="secondary"
                                fullWidth
                                onClick={() => {
                                    setShowGuestModal(false);
                                    onLogin?.();
                                }}
                            >
                                {t("bookGuest.login")}
                            </Button>
                            <Button
                                fullWidth
                                onClick={() => {
                                    setShowGuestModal(false);
                                    onRegister?.();
                                }}
                            >
                                {t("bookGuest.register")}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
