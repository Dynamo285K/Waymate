import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PassengerNavbar, AvailableRideCard } from "waymate-ui";
import type { Language } from "waymate-ui";
import i18n from "../i18n";

type PassengerRidesPageProps = {
    language: Language;
    theme: "light" | "dark";
    onLanguageChange: (lang: Language) => void;
    onThemeToggle: () => void;
    userName?: string;
    userEmail?: string;
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

export function PassengerRidesPage({
    language,
    theme,
    onLanguageChange,
    onThemeToggle,
    userName,
    userEmail,
}: PassengerRidesPageProps) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

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
            <PassengerNavbar
                activeTab="find-ride"
                language={language}
                onLanguageChange={onLanguageChange}
                role="passenger"
                onRoleChange={(r) => r === "driver" && navigate("/driver")}
                theme={theme}
                onThemeToggle={onThemeToggle}
                userName={userName}
                userEmail={userEmail}
                onLogoClick={() => navigate("/passenger")}
                onFindRideClick={() => navigate("/passenger")}
                onMyRidesClick={() => navigate("/passenger/rides")}
                onChatClick={() => navigate("/passenger/chat")}
                onMessagesClick={() => navigate("/passenger/chat")}
                onProfileClick={() => navigate("/passenger/profile")}
                onRatingsClick={() => navigate("/passenger/ratings")}
                onLogoutClick={() => navigate("/")}
                labels={{
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
                            onBook={() =>
                                navigate("/passenger/rides", {
                                    state: {
                                        bookedRide: {
                                            id: Date.now(),
                                            from: ride.from,
                                            to: ride.to,
                                            date: ride.date.toISOString(),
                                            price: ride.price,
                                            driverName: ride.driverName,
                                            driverRating: ride.driverRating,
                                            seatsLeft: ride.seatsLeft,
                                            status: "pending",
                                        },
                                    },
                                })
                            }
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
        </div>
    );
}
