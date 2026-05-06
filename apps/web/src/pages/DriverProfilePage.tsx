import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "../lib/router-compat";
import { ProfileHeroCard, CarCard, Button } from "@waymate/ui";
import type { Language } from "../components/controls/LanguageSwitcher";
import { DriverNavbar } from "../components/navigation/DriverNavbar";
import { RideCard } from "../components/RideCard";
import { useDriverNavbarProps } from "../hooks/useDriverNavbarProps";
import { useCancelRide } from "../hooks/useCancelRide";
import { useGetRidesMe } from "../api-client/rides/rides";
import { formatRideDate as formatDate } from "../lib/date-format";
import { useGetCarsMe } from "../api-client/cars/cars";
import { useGetReviewsUsersByUserId } from "../api-client/reviews/reviews";
import { getErrorI18nKey } from "../lib/api-errors";

type Props = {
    language: Language;
    theme: "light" | "dark";
    onLanguageChange: (l: Language) => void;
    onThemeToggle: () => void;
    userName?: string;
    userEmail?: string;
    userBio?: string;
    userCreatedAt?: string | Date;
    userId?: string;
};

export function DriverProfilePage({
    language,
    theme,
    onLanguageChange,
    onThemeToggle,
    userName,
    userEmail,
    userBio,
    userCreatedAt,
    userId,
}: Props) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const displayName = userName ?? t("profile.fallbackName", "User");
    const displayEmail = userEmail ?? "";
    const memberSince = formatMemberSince(userCreatedAt, language);
    const aboutMe = userBio?.trim();
    const [cancellingRideId, setCancellingRideId] = useState<string | null>(
        null
    );
    const {
        data: rides,
        isLoading: ridesLoading,
        isError: ridesError,
        error: ridesErrorObj,
    } = useGetRidesMe({ timeframe: "UPCOMING" });
    const cancelRide = useCancelRide();
    const carsQuery = useGetCarsMe();
    const { data: receivedReviews } = useGetReviewsUsersByUserId(userId ?? "", {
        query: { enabled: Boolean(userId) },
    });
    const profileRating =
        receivedReviews?.averageRating != null
            ? receivedReviews.averageRating.toFixed(1)
            : "0.0";
    const navbarProps = useDriverNavbarProps({
        language,
        onLanguageChange,
        theme,
        onThemeToggle,
        userName,
        userEmail,
    });
    const upcomingRides =
        rides?.map((ride) => {
            const sortedStops = [...ride.rideStops].sort(
                (a, b) => a.stopOrder - b.stopOrder
            );
            const from = sortedStops[0]?.city ?? "";
            const to = sortedStops[sortedStops.length - 1]?.city ?? "";
            const confirmedSeats = ride.bookings.reduce(
                (sum, booking) => sum + booking.seatCount,
                0
            );
            const remainingSeats = ride.offeredSeats - confirmedSeats;

            return {
                id: ride.id,
                from,
                to,
                date: ride.departureAt,
                price: ride.prices[0]?.amount ?? 0,
                seatsLeft:
                    remainingSeats > 0 ? remainingSeats : ("full" as const),
            };
        }) ?? [];

    function handleCancelRide(rideId: string) {
        if (cancelRide.isPending && cancellingRideId === rideId) return;

        setCancellingRideId(rideId);
        cancelRide.mutate(
            { rideId },
            {
                onSettled: () => setCancellingRideId(null),
            }
        );
    }

    return (
        <div
            data-theme={theme}
            className="min-h-screen bg-(--color-bg)"
        >
            <DriverNavbar {...navbarProps} />

            <div className="w-full px-4 sm:max-w-5xl sm:mx-auto sm:px-8 py-8 sm:py-12 flex flex-col gap-6">
                <ProfileHeroCard
                    name={displayName}
                    email={displayEmail}
                    rating={profileRating}
                    memberSince={memberSince}
                    onViewRatingsClick={() =>
                        navigate("/driver/ratings?view=received")
                    }
                    onEditProfileClick={() =>
                        navigate("/profile/edit", { state: { role: "driver" } })
                    }
                    labels={{
                        viewAllRatings: t("profile.viewAllRatings"),
                        memberSince: t("profile.memberSince"),
                        editProfile: t("profile.editProfile"),
                    }}
                />

                {aboutMe && (
                    <div className="bg-(--color-card) rounded-2xl p-6 border border-(--color-border)">
                        <h2 className="text-base font-semibold text-(--color-text-primary) mb-3">
                            {t("profile.aboutMe")}
                        </h2>
                        <p className="text-(--color-text-secondary) text-sm leading-relaxed">
                            {aboutMe}
                        </p>
                    </div>
                )}

                <div className="flex flex-col lg:flex-row gap-6">
                    <div className="flex-1 flex flex-col gap-4">
                        <h2 className="text-lg font-bold text-(--color-text-primary)">
                            {t("profile.myUpcomingRides")}
                        </h2>
                        {ridesLoading && (
                            <p className="text-(--color-text-secondary)">
                                {t("driverRides.loading")}
                            </p>
                        )}

                        {ridesError && (
                            <p className="text-(--color-text-secondary)">
                                {t(
                                    getErrorI18nKey(
                                        ridesErrorObj,
                                        {},
                                        "driverRides.error"
                                    )
                                )}
                            </p>
                        )}

                        {cancelRide.isError && (
                            <p className="text-(--color-text-secondary)">
                                {t(
                                    getErrorI18nKey(
                                        cancelRide.error,
                                        {},
                                        "driverRides.cancelError"
                                    )
                                )}
                            </p>
                        )}

                        {!ridesLoading &&
                            !ridesError &&
                            upcomingRides.length === 0 && (
                                <p className="text-(--color-text-secondary)">
                                    {t("driverRides.noResults")}
                                </p>
                            )}

                        {!ridesLoading &&
                            !ridesError &&
                            upcomingRides.map((ride) => {
                                const isCancelling =
                                    cancelRide.isPending &&
                                    cancellingRideId === ride.id;

                                return (
                                    <RideCard
                                        key={ride.id}
                                        variant="driver-upcoming"
                                        from={ride.from}
                                        to={ride.to}
                                        datetime={formatDate(
                                            new Date(ride.date),
                                            t("home.at")
                                        )}
                                        price={ride.price}
                                        seatsLeft={ride.seatsLeft}
                                        onViewPassengers={() =>
                                            navigate(
                                                "/driver/rides/passengers",
                                                {
                                                    state: { ride },
                                                }
                                            )
                                        }
                                        onCancelRide={() =>
                                            handleCancelRide(ride.id)
                                        }
                                        labels={{
                                            seatsLeft: (count) =>
                                                t("driverRides.seatsLeft", {
                                                    count,
                                                }),
                                            full: t("driverRides.full"),
                                            viewPassengers: t(
                                                "driverRides.viewPassengers"
                                            ),
                                            cancelRide: isCancelling
                                                ? t(
                                                      "driverRides.cancelling",
                                                      "Cancelling..."
                                                  )
                                                : t("profile.cancelRide"),
                                        }}
                                    />
                                );
                            })}
                    </div>

                    <div className="lg:w-72 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-(--color-text-primary)">
                                {t("profile.myCars")}
                            </h2>
                            <Button
                                onClick={() =>
                                    navigate("/car/add", {
                                        state: { role: "driver" },
                                    })
                                }
                            >
                                {t("profile.addCar")}
                            </Button>
                        </div>
                        {carsQuery.isLoading && (
                            <p className="text-(--color-text-secondary)">
                                {t("profile.loadingCars", "Loading cars...")}
                            </p>
                        )}
                        {carsQuery.isError && (
                            <p className="text-(--color-text-secondary)">
                                {t(
                                    getErrorI18nKey(
                                        carsQuery.error,
                                        {},
                                        "profile.carsError"
                                    )
                                )}
                            </p>
                        )}
                        {!carsQuery.isLoading &&
                            !carsQuery.isError &&
                            carsQuery.data?.length === 0 && (
                                <p className="text-(--color-text-secondary)">
                                    {t(
                                        "profile.noCars",
                                        "You have no saved cars yet."
                                    )}
                                </p>
                            )}
                        {carsQuery.data?.map((car) => (
                            <CarCard
                                key={car.id}
                                model={`${car.brand} ${car.modelName}`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function formatMemberSince(
    value: string | Date | undefined,
    language: Language
) {
    if (!value) return "";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    return new Intl.DateTimeFormat(language, {
        month: "long",
        year: "numeric",
    }).format(date);
}
