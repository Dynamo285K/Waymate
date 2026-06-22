import { useTranslation } from "react-i18next";
import { enUS, sk as skLocale, cs } from "date-fns/locale";
import { SearchBox, PopularRouteChip, Button } from "@waymate/ui";
import type { SearchBoxCityOption } from "@waymate/ui";
import type { Language } from "../controls/LanguageSwitcher";
import { AvailableRideCard } from "./AvailableRideCard";
import { HomeStatsSection } from "./HomeStatsSection";
import { HomeFeaturesSection } from "./HomeFeaturesSection";
import { formatRideDate, formatDuration } from "../../lib/date-format";
import { toUiLanguage } from "../../lib/language";
import {
    useGetRidesAvailable,
    useGetRidesPopularRoutes,
} from "../../api-client/rides/rides";
import { fetchPhotonLocations } from "../../lib/geocoding/photon";
import { useUserLocation } from "../../hooks/shared/useUserLocation";

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
        date: Date | undefined,
        seats: number
    ) => void;
    onViewAllRides?: () => void;
    onBook?: (ride: AvailableRide) => void;
};

const DATE_FNS_LOCALE_MAP = { en: enUS, sk: skLocale, cs };

export function HomeContent({
    language,
    onSearch,
    onViewAllRides,
    onBook,
}: HomeContentProps) {
    const { t } = useTranslation();
    const userLocation = useUserLocation();
    const {
        data: availableRideRows,
        isLoading: areAvailableRidesLoading,
        isError: areAvailableRidesError,
    } = useGetRidesAvailable();
    const { data: popularRouteRows } = useGetRidesPopularRoutes();

    const popularRoutes = Array.isArray(popularRouteRows)
        ? popularRouteRows
        : [];

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
                            const results = await fetchPhotonLocations(
                                q,
                                userLocation
                            );
                            return results.map((c) => ({
                                id: c.id,
                                name: `${c.address}${c.city && c.city !== c.address ? `, ${c.city}` : ""} (${c.countryCode})`,
                                lat: c.lat,
                                lng: c.lng,
                                city: c.city,
                                address: c.address,
                                countryCode: c.countryCode,
                            }));
                        }}
                        onSearch={(from, to, date, seats) =>
                            onSearch?.(from, to, date, seats)
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
                            seats: t("home.search.seats"),
                        }}
                    />
                </div>
            </section>

            {/* Popular routes */}
            {popularRoutes.length > 0 && (
                <section className="w-full px-4 sm:max-w-5xl sm:mx-auto sm:px-8 pb-8 sm:pb-12">
                    <p className="text-sm font-semibold text-(--color-text-secondary) mb-3">
                        {t("home.popularRoutes")}
                    </p>
                    <div className="flex flex-wrap gap-3">
                        {popularRoutes.map((r) => (
                            <PopularRouteChip
                                key={`${r.originCity}-${r.destinationCity}`}
                                from={r.originCity}
                                to={r.destinationCity}
                                count={r.count}
                                onClick={() => {
                                    onSearch?.(
                                        {
                                            id: r.originCity,
                                            name: r.originCity,
                                            lat: r.originLat ?? 0,
                                            lng: r.originLng ?? 0,
                                            city: r.originCity,
                                        },
                                        {
                                            id: r.destinationCity,
                                            name: r.destinationCity,
                                            lat: r.destLat ?? 0,
                                            lng: r.destLng ?? 0,
                                            city: r.destinationCity,
                                        },
                                        undefined,
                                        1
                                    );
                                }}
                            />
                        ))}
                    </div>
                </section>
            )}

            <div className="border-t border-(--color-border)" />

            {/* Stats */}
            <HomeStatsSection />

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
            <HomeFeaturesSection />
        </>
    );
}
