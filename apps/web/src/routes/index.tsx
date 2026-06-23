import { useState } from "react";
import { useTranslation } from "react-i18next";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button, LockIcon, Modal } from "@waymate/ui";
import type { SearchBoxCityOption } from "@waymate/ui";
import type { Language } from "../components/controls/LanguageSwitcher";
import { AuthNavbarFrame } from "../components/navigation/AuthNavbarFrame";
import { HomeContent } from "../components/shared/HomeContent";
import { useAuthNavbarProps } from "../hooks/shared/useAuthNavbarProps";
import { useLayout } from "../lib/use-layout";
import { requireAudience } from "../lib/route-guards";

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

function HomePage({
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
            className="min-h-screen bg-background"
        >
            <AuthNavbarFrame {...authNavbarProps} />
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
                <div className="w-modal-viewport max-w-sm p-8 text-center flex flex-col gap-4">
                    <div className="inline-flex justify-center text-primary">
                        <LockIcon />
                    </div>
                    <h2 className="text-xl font-bold text-text-primary">
                        {t("bookGuest.title")}
                    </h2>
                    <p className="text-text-secondary text-sm">
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

function IndexRoute() {
    const layout = useLayout();
    const navigate = useNavigate();
    return (
        <HomePage
            {...layout}
            onLogin={() => navigate({ to: "/login" })}
            onRegister={() => navigate({ to: "/register" })}
            onLogoClick={() => navigate({ to: "/" })}
            onSearch={(from, to, date) => {
                navigate({
                    to: "/rides",
                    search: {
                        startLat: from?.lat,
                        startLng: from?.lng,
                        startCity: from?.name,
                        destLat: to?.lat,
                        destLng: to?.lng,
                        destCity: to?.name,
                        date: date?.toISOString(),
                    },
                });
            }}
            onViewAllRides={() => navigate({ to: "/rides" })}
        />
    );
}

export const Route = createFileRoute("/")({
    beforeLoad: requireAudience(["guest"]),
    component: IndexRoute,
});
