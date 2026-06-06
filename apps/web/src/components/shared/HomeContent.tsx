import { useTranslation } from "react-i18next";
import { enUS, sk as skLocale, cs } from "date-fns/locale";
import {
    SearchBox,
    PopularRouteChip,
    StatCard,
    FeatureCard,
    Button,
} from "@waymate/ui";
import type { SearchBoxCityOption } from "@waymate/ui";
import type { Language } from "../controls/LanguageSwitcher";
import { AvailableRideCard } from "./AvailableRideCard";
import { formatRideDate, formatDuration } from "../../lib/date-format";
import { toUiLanguage } from "../../lib/language";
import { useGetRidesAvailable } from "../../api-client/rides/rides";
import { getCities } from "../../api-client/cities/cities";

type AvailableRide = {
    id: string | number;
    rideId?: string;
    pickupStopId?: string;
    dropoffStopId?: string;
    from: string;
    to: string;
    date: Date;
    duration?: string;
    seatsLeft: number;
    driverName: string;
    driverRating: number;
    price: number;
};

type HomeContentProps = {
    language: Language;
    onSearch?: (
        from: SearchBoxCityOption | null,
        to: SearchBoxCityOption | null,
        date: Date | undefined
    ) => void;
    onViewAllRides?: () => void;
    onBook?: (ride: AvailableRide) => void;
};

const POPULAR_ROUTES = [
    { from: "Praha", to: "Brno", count: 42 },
    { from: "Praha", to: "Viedeň", count: 27 },
    { from: "Brno", to: "Martin", count: 23 },
    { from: "Bratislava", to: "Košice", count: 15 },
];

const DATE_FNS_LOCALE_MAP = { en: enUS, sk: skLocale, cs };

function IconBox({
    bg,
    color,
    children,
}: {
    bg: string;
    color: string;
    children: React.ReactNode;
}) {
    return (
        <div
            className={`w-full h-full ${bg} ${color} rounded-xl flex items-center justify-center`}
        >
            {children}
        </div>
    );
}

function UsersIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle
                cx="9"
                cy="7"
                r="4"
            />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    );
}

function StarIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
    );
}

function LeafIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
            <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
        </svg>
    );
}

function ShieldIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
    );
}

function CoinsIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle
                cx="8"
                cy="8"
                r="6"
            />
            <path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
            <path d="M7 6h1v4" />
            <path d="m16.71 13.88.7.71-2.82 2.82" />
        </svg>
    );
}

function MessageIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
    );
}

function BoltIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
    );
}

export function HomeContent({
    language,
    onSearch,
    onViewAllRides,
    onBook,
}: HomeContentProps) {
    const { t } = useTranslation();
    const {
        data: availableRideRows,
        isLoading: areAvailableRidesLoading,
        isError: areAvailableRidesError,
    } = useGetRidesAvailable();

    const availableRides: AvailableRide[] = Array.isArray(availableRideRows)
        ? availableRideRows.map((ride) => {
              const driverName = [ride.driver.firstName, ride.driver.lastName]
                  .filter(Boolean)
                  .join(" ");

              return {
                  id: ride.rideId,
                  rideId: ride.rideId,
                  pickupStopId: ride.pickupStop.pickupStopId,
                  dropoffStopId: ride.dropoffStop.dropoffStopId,
                  from: ride.pickupStop.city,
                  to: ride.dropoffStop.city,
                  date: new Date(
                      ride.pickupStop.plannedDepartureAt ?? ride.departureAt
                  ),
                  seatsLeft: ride.seatsLeft,
                  duration: formatDuration(
                      ride.departureAt,
                      ride.arrivalEstimateAt
                  ),
                  driverName: driverName || t("roles.driver"),
                  driverRating: ride.driver.averageRating ?? 0,
                  price: ride.priceAmount ?? 0,
              };
          })
        : [];
    const visibleAvailableRides = availableRides.slice(0, 5);

    return (
        <>
            {/* Hero */}
            <section className="flex flex-col items-center pt-16 sm:pt-28 pb-10 sm:pb-16 px-4">
                <h1 className="text-3xl sm:text-5xl font-black text-(--color-text-primary) tracking-tight text-center">
                    {t("home.hero.title")}
                </h1>
                <p className="mt-3 text-lg text-(--color-text-secondary) text-center">
                    {t("home.hero.subtitle")}
                </p>
                <div className="mt-8 w-full max-w-2xl">
                    <SearchBox
                        onSearchCities={async (q) => {
                            const results = await getCities({ q, limit: 8 });
                            return results.map((c) => ({
                                id: c.id,
                                name: c.name,
                            }));
                        }}
                        onSearch={(from, to, date) =>
                            onSearch?.(from, to, date)
                        }
                        locale={
                            DATE_FNS_LOCALE_MAP[
                                toUiLanguage(
                                    language
                                ) as keyof typeof DATE_FNS_LOCALE_MAP
                            ] ??
                            DATE_FNS_LOCALE_MAP[
                                language as keyof typeof DATE_FNS_LOCALE_MAP
                            ] ??
                            enUS
                        }
                        labels={{
                            from: t("home.search.from"),
                            to: t("home.search.to"),
                            search: t("home.search.button"),
                            datePlaceholder: t("home.search.date"),
                        }}
                    />
                </div>
            </section>

            {/* Popular routes */}
            <section className="w-full px-4 sm:max-w-5xl sm:mx-auto sm:px-8 pb-8 sm:pb-12">
                <p className="text-sm font-semibold text-(--color-text-secondary) mb-3">
                    {t("home.popularRoutes")}
                </p>
                <div className="flex flex-wrap gap-3">
                    {POPULAR_ROUTES.map((r) => (
                        <PopularRouteChip
                            key={`${r.from}-${r.to}`}
                            from={r.from}
                            to={r.to}
                            count={r.count}
                        />
                    ))}
                </div>
            </section>

            <div className="border-t border-(--color-border)" />

            {/* Stats */}
            <section className="w-full px-4 sm:max-w-5xl sm:mx-auto sm:px-8 py-8 sm:py-12 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard
                    icon={
                        <IconBox
                            bg="bg-(--color-success-bg)"
                            color="text-(--color-success-text)"
                        >
                            <UsersIcon />
                        </IconBox>
                    }
                    value="12 500+"
                    label={t("home.stats.drivers")}
                />
                <StatCard
                    icon={
                        <IconBox
                            bg="bg-(--color-warning-bg)"
                            color="text-(--color-warning-text)"
                        >
                            <StarIcon />
                        </IconBox>
                    }
                    value="4.9/5.0"
                    label={t("home.stats.satisfaction")}
                />
                <StatCard
                    icon={
                        <IconBox
                            bg="bg-(--color-success-bg)"
                            color="text-(--color-success-text)"
                        >
                            <LeafIcon />
                        </IconBox>
                    }
                    value="2 400t"
                    label={t("home.stats.co2Saved")}
                />
            </section>

            <div className="border-t border-(--color-border)" />

            {/* Available rides */}
            <section className="w-full px-4 sm:max-w-5xl sm:mx-auto sm:px-8 py-8 sm:py-12">
                <h2 className="text-2xl font-bold text-(--color-text-primary)">
                    {t("home.availableRides.title")}
                </h2>
                <p className="text-(--color-text-secondary) mt-1 mb-6">
                    {t("home.availableRides.subtitle")}
                </p>
                <div className="flex flex-col gap-3">
                    {areAvailableRidesLoading && (
                        <p className="text-(--color-text-secondary)">
                            {t("rides.loading")}
                        </p>
                    )}
                    {areAvailableRidesError && (
                        <p className="text-(--color-text-secondary)">
                            {t("rides.error")}
                        </p>
                    )}
                    {!areAvailableRidesLoading &&
                        !areAvailableRidesError &&
                        availableRides.length === 0 && (
                            <p className="text-(--color-text-secondary)">
                                {t("rides.noResults")}
                            </p>
                        )}
                    {!areAvailableRidesLoading &&
                        !areAvailableRidesError &&
                        visibleAvailableRides.map((ride) => (
                            <AvailableRideCard
                                key={ride.id}
                                from={ride.from}
                                to={ride.to}
                                datetime={formatRideDate(
                                    ride.date,
                                    t("home.at")
                                )}
                                duration={ride.duration}
                                seatsLeft={ride.seatsLeft}
                                driverName={ride.driverName}
                                driverRating={ride.driverRating}
                                price={ride.price}
                                onBook={() => onBook?.(ride)}
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
                {availableRides.length > 0 && (
                    <div className="flex justify-center mt-8">
                        <Button
                            variant="outlineSuccess"
                            onClick={onViewAllRides}
                        >
                            {t("home.availableRides.viewAll")}
                        </Button>
                    </div>
                )}
            </section>

            {/* Features */}
            <section className="bg-(--color-bg) border-t border-(--color-border) py-16 px-4">
                <div className="w-full sm:max-w-5xl sm:mx-auto text-center">
                    <h2 className="text-2xl sm:text-4xl font-black text-(--color-text-primary)">
                        {t("home.features.title")}
                    </h2>
                    <p className="mt-2 text-(--color-text-secondary)">
                        {t("home.features.subtitle")}
                    </p>
                    <div className="mt-8 sm:mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-left">
                        <FeatureCard
                            icon={
                                <IconBox
                                    bg="bg-(--color-success-bg)"
                                    color="text-(--color-success-text)"
                                >
                                    <ShieldIcon />
                                </IconBox>
                            }
                            title={t("home.features.verifiedDrivers.title")}
                            description={t(
                                "home.features.verifiedDrivers.description"
                            )}
                        />
                        <FeatureCard
                            icon={
                                <IconBox
                                    bg="bg-(--color-success-bg)"
                                    color="text-(--color-success-text)"
                                >
                                    <CoinsIcon />
                                </IconBox>
                            }
                            title={t("home.features.fairPricing.title")}
                            description={t(
                                "home.features.fairPricing.description"
                            )}
                        />
                        <FeatureCard
                            icon={
                                <IconBox
                                    bg="bg-(--color-primary)/10"
                                    color="text-(--color-primary)"
                                >
                                    <LeafIcon />
                                </IconBox>
                            }
                            title={t("home.features.ecoFriendly.title")}
                            description={t(
                                "home.features.ecoFriendly.description"
                            )}
                        />
                        <FeatureCard
                            icon={
                                <IconBox
                                    bg="bg-(--color-primary)/10"
                                    color="text-(--color-primary)"
                                >
                                    <MessageIcon />
                                </IconBox>
                            }
                            title={t("home.features.directChat.title")}
                            description={t(
                                "home.features.directChat.description"
                            )}
                        />
                        <FeatureCard
                            icon={
                                <IconBox
                                    bg="bg-(--color-warning-bg)"
                                    color="text-(--color-warning-text)"
                                >
                                    <BoltIcon />
                                </IconBox>
                            }
                            title={t("home.features.fastBooking.title")}
                            description={t(
                                "home.features.fastBooking.description"
                            )}
                        />
                        <FeatureCard
                            icon={
                                <IconBox
                                    bg="bg-(--color-danger-bg)"
                                    color="text-(--color-danger-text)"
                                >
                                    <StarIcon />
                                </IconBox>
                            }
                            title={t("home.features.ratings.title")}
                            description={t("home.features.ratings.description")}
                        />
                    </div>
                </div>
            </section>
        </>
    );
}
