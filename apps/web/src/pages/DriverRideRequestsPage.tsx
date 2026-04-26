import { useState } from "react";
import { useTranslation } from "react-i18next";
import { DriverNavbar, RideRequestCard } from "waymate-ui";
import type { Language } from "waymate-ui";
import { useDriverNavbarProps } from "../hooks/useDriverNavbarProps";
import i18n from "../i18n";

const LOCALE_MAP: Record<string, string> = {
    en: "en-US",
    sk: "sk-SK",
    cz: "cs-CZ",
};

function formatDate(date: Date, atLabel: string) {
    const locale = LOCALE_MAP[i18n.language] ?? "en-US";
    const datePart = new Intl.DateTimeFormat(locale, {
        day: "numeric",
        month: "long",
    }).format(date);
    const timePart = new Intl.DateTimeFormat(locale, {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    }).format(date);
    return `${datePart} ${atLabel} ${timePart}`;
}

const REQUESTS = [
    {
        id: 1,
        name: "Bob Smith",
        rating: 4.9,
        seatsRequired: 1,
        from: "Martin",
        to: "Brno",
        date: new Date(2026, 2, 15, 8, 0),
    },
    {
        id: 2,
        name: "Alice Brown",
        rating: 5,
        seatsRequired: 2,
        from: "Martin",
        to: "Brno",
        date: new Date(2026, 2, 15, 8, 0),
    },
    {
        id: 3,
        name: "Carol Davis",
        rating: 4.8,
        seatsRequired: 3,
        from: "Martin",
        to: "Brno",
        date: new Date(2026, 2, 15, 8, 0),
    },
];

type Props = {
    language: Language;
    theme: "light" | "dark";
    onLanguageChange: (l: Language) => void;
    onThemeToggle: () => void;
    userName?: string;
    userEmail?: string;
};

export function DriverRideRequestsPage({
    language,
    theme,
    onLanguageChange,
    onThemeToggle,
    userName,
    userEmail,
}: Props) {
    const { t } = useTranslation();
    const navbarProps = useDriverNavbarProps({
        activeTab: "ride-requests",
        language,
        onLanguageChange,
        theme,
        onThemeToggle,
        userName,
        userEmail,
    });
    const [requests, setRequests] = useState(REQUESTS);

    const requestLabels = {
        seatsRequired: (count: number) =>
            t("rideRequests.seatsRequired", { count }),
        accept: t("rideRequests.accept"),
        decline: t("rideRequests.decline"),
    };

    function handleAccept(id: number) {
        setRequests((prev) => prev.filter((r) => r.id !== id));
    }

    function handleDecline(id: number) {
        setRequests((prev) => prev.filter((r) => r.id !== id));
    }

    return (
        <div
            data-theme={theme}
            className="min-h-screen bg-(--color-bg)"
        >
            <DriverNavbar {...navbarProps} />
            <section className="w-full px-4 sm:max-w-3xl sm:mx-auto sm:px-8 py-8 sm:py-12">
                <h1 className="text-2xl font-bold text-(--color-text-primary)">
                    {t("rideRequests.title")}
                </h1>
                <p className="text-(--color-text-secondary) mt-1 mb-8">
                    {t("rideRequests.subtitle")}
                </p>
                <div className="flex flex-col gap-4">
                    {requests.length === 0 ? (
                        <p className="text-(--color-text-secondary) text-center py-12">
                            {t("rideRequests.empty", "No pending requests.")}
                        </p>
                    ) : (
                        requests.map((req) => (
                            <RideRequestCard
                                key={req.id}
                                name={req.name}
                                rating={req.rating}
                                seatsRequired={req.seatsRequired}
                                from={req.from}
                                to={req.to}
                                datetime={formatDate(req.date, t("home.at"))}
                                onAccept={() => handleAccept(req.id)}
                                onDecline={() => handleDecline(req.id)}
                                labels={requestLabels}
                            />
                        ))
                    )}
                </div>
            </section>
        </div>
    );
}
