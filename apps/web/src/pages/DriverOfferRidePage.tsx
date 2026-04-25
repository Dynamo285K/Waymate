import { useTranslation } from "react-i18next";
import { DriverNavbar, OfferRideForm } from "waymate-ui";
import type { Language } from "waymate-ui";
import { useDriverNavbarProps } from "../hooks/useDriverNavbarProps";

type Props = {
    language: Language;
    theme: "light" | "dark";
    onLanguageChange: (l: Language) => void;
    onThemeToggle: () => void;
    userName?: string;
    userEmail?: string;
};

export function DriverOfferRidePage({
    language,
    theme,
    onLanguageChange,
    onThemeToggle,
    userName,
    userEmail,
}: Props) {
    const { t } = useTranslation();
    const navbarProps = useDriverNavbarProps({
        activeTab: "offer-ride",
        language,
        onLanguageChange,
        theme,
        onThemeToggle,
        userName,
        userEmail,
    });

    return (
        <div
            data-theme={theme}
            className="min-h-screen bg-(--color-bg)"
        >
            <DriverNavbar {...navbarProps} />
            <div className="w-full px-4 sm:max-w-3xl sm:mx-auto sm:px-8 py-8 sm:py-12">
                <OfferRideForm
                    title={t("offerRide.title")}
                    subtitle={t("offerRide.subtitle")}
                    publishLabel={t("offerRide.publish")}
                    onPublishClick={() => {}}
                />
            </div>
        </div>
    );
}
