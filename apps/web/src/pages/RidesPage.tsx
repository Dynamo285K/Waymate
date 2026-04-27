import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "../lib/router-compat";
import { AuthNavbar, AvailableRideCard, Button } from "waymate-ui";
import type { Language } from "waymate-ui";
import i18n from "../i18n";

type RidesPageProps = {
    language: Language;
    theme: "light" | "dark";
    onLanguageChange: (lang: Language) => void;
    onThemeToggle: () => void;
    onLogin?: () => void;
    onRegister?: () => void;
    onLogoClick?: () => void;
};

const LOCALE_MAP: Record<string, string> = {
    en: "en-US",
    sk: "sk-SK",
    cz: "cs-CZ",
};

function formatRideDate(date: Date, atLabel: string): string {
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

const ALL_RIDES = [
    {
        id: 1,
        from: "Martin",
        to: "Brno",
        date: new Date(2026, 2, 15, 8, 0),
        seatsLeft: 2,
        driverName: "Sarah Johnson",
        driverRating: 4.9,
        price: 10,
    },
    {
        id: 2,
        from: "Žilina",
        to: "Praha",
        date: new Date(2026, 2, 15, 10, 0),
        seatsLeft: 1,
        driverName: "Mike Chen",
        driverRating: 4.8,
        price: 21,
    },
    {
        id: 3,
        from: "Brno",
        to: "Bratislava",
        date: new Date(2026, 2, 15, 9, 0),
        seatsLeft: 3,
        driverName: "Emma Wilson",
        driverRating: 5,
        price: 6,
    },
    {
        id: 4,
        from: "Brno",
        to: "Banská Bystrica",
        date: new Date(2026, 2, 15, 15, 0),
        seatsLeft: 2,
        driverName: "David Brown",
        driverRating: 4.7,
        price: 15,
    },
    {
        id: 5,
        from: "Martin",
        to: "Brno",
        date: new Date(2026, 2, 15, 8, 0),
        seatsLeft: 2,
        driverName: "Sarah Johnson",
        driverRating: 4.9,
        price: 10,
    },
    {
        id: 6,
        from: "Žilina",
        to: "Praha",
        date: new Date(2026, 2, 15, 10, 0),
        seatsLeft: 1,
        driverName: "Mike Chen",
        driverRating: 4.8,
        price: 21,
    },
    {
        id: 7,
        from: "Brno",
        to: "Bratislava",
        date: new Date(2026, 2, 15, 9, 0),
        seatsLeft: 3,
        driverName: "Emma Wilson",
        driverRating: 5,
        price: 6,
    },
    {
        id: 8,
        from: "Brno",
        to: "Banská Bystrica",
        date: new Date(2026, 2, 15, 15, 0),
        seatsLeft: 2,
        driverName: "David Brown",
        driverRating: 4.7,
        price: 15,
    },
    {
        id: 9,
        from: "Martin",
        to: "Brno",
        date: new Date(2026, 2, 15, 8, 0),
        seatsLeft: 2,
        driverName: "Sarah Johnson",
        driverRating: 4.9,
        price: 10,
    },
    {
        id: 10,
        from: "Žilina",
        to: "Praha",
        date: new Date(2026, 2, 15, 10, 0),
        seatsLeft: 1,
        driverName: "Mike Chen",
        driverRating: 4.8,
        price: 21,
    },
    {
        id: 11,
        from: "Brno",
        to: "Bratislava",
        date: new Date(2026, 2, 15, 9, 0),
        seatsLeft: 3,
        driverName: "Emma Wilson",
        driverRating: 5,
        price: 6,
    },
];

export function RidesPage({
    language,
    theme,
    onLanguageChange,
    onThemeToggle,
    onLogin,
    onRegister,
    onLogoClick,
}: RidesPageProps) {
    const { t } = useTranslation();
    const [searchParams] = useSearchParams();
    const [showGuestModal, setShowGuestModal] = useState(false);

    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const rides =
        from || to
            ? ALL_RIDES.filter(
                  (r) =>
                      (!from ||
                          r.from.toLowerCase().includes(from.toLowerCase())) &&
                      (!to || r.to.toLowerCase().includes(to.toLowerCase()))
              )
            : ALL_RIDES;

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

            <section className="w-full px-4 sm:max-w-3xl sm:mx-auto sm:px-8 py-8 sm:py-12">
                <h2 className="text-2xl font-bold text-(--color-text-primary)">
                    {t("home.availableRides.title")}
                </h2>
                <p className="text-(--color-text-secondary) mt-1 mb-8">
                    {t("rides.found", { count: rides.length })}
                </p>

                <div className="flex flex-col gap-3">
                    {rides.map((ride) => (
                        <AvailableRideCard
                            key={ride.id}
                            from={ride.from}
                            to={ride.to}
                            datetime={formatRideDate(ride.date, t("home.at"))}
                            seatsLeft={ride.seatsLeft}
                            driverName={ride.driverName}
                            driverRating={ride.driverRating}
                            price={ride.price}
                            onBook={() => setShowGuestModal(true)}
                            labels={{
                                seatsLeft: (count) =>
                                    t("home.availableRides.seatsLeft", {
                                        count,
                                    }),
                                book: t("home.availableRides.book"),
                            }}
                        />
                    ))}
                </div>
            </section>

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
