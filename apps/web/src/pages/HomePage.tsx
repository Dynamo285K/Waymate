import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AuthNavbar, Button, Modal } from "@waymate/ui";
import type { SearchBoxCityOption } from "@waymate/ui";
import type { Language } from "../components/controls/LanguageSwitcher";
import { HomeContent } from "../components/HomeContent";
import { useAuthNavbarProps } from "../hooks/useAuthNavbarProps";

type HomePageProps = {
    language: Language;
    theme: "light" | "dark";
    onLanguageChange: (lang: Language) => void;
    onThemeToggle: () => void;
    onLogin?: () => void;
    onRegister?: () => void;
    onLogoClick?: () => void;
    onSearch?: (
        from: SearchBoxCityOption | null,
        to: SearchBoxCityOption | null,
        date: Date | undefined
    ) => void;
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
    const authNavbarProps = useAuthNavbarProps({
        language,
        onLanguageChange,
        theme,
        onThemeToggle,
        onLogin,
        onRegister,
        onLogoClick,
    });

    return (
        <div
            data-theme={theme}
            className="min-h-screen bg-(--color-bg)"
        >
            <AuthNavbar {...authNavbarProps} />
            <HomeContent
                language={language}
                onSearch={onSearch}
                onViewAllRides={onViewAllRides}
                onBook={() => setShowGuestModal(true)}
            />

            <Modal
                open={showGuestModal}
                onClose={() => setShowGuestModal(false)}
            >
                <div className="w-[calc(100vw-2rem)] max-w-sm p-8 text-center flex flex-col gap-4">
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
            </Modal>
        </div>
    );
}
