import { useState } from "react";
import { useTranslation } from "react-i18next";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ProfileHeroCard, CarCard, Button, Modal } from "@waymate/ui";
import type { Language } from "../../components/controls/LanguageSwitcher";
import { DriverNavbar } from "../../components/navigation/DriverNavbar";
import { authClient } from "../../lib/auth-client";
import { getDisplayName } from "../../lib/session-user";
import { useLayout } from "../../lib/use-layout";
import { RideCard } from "../../components/shared/RideCard";
import { useDriverNavbarProps } from "../../features/driver/hooks/useDriverNavbarProps";
import { useCancelRide } from "../../features/driver/hooks/useCancelRide";
import { useDeleteCar } from "./-profile/hooks/useDeleteCar";
import { CancelRideDialog } from "../../components/shared/CancelRideDialog";
import { useGetRidesMe } from "../../api-client/rides/rides";
import {
    formatRideDate as formatDate,
    formatDuration,
} from "../../lib/date-format";
import { useGetCarsMe } from "../../api-client/cars/cars";
import { useGetReviewsUsersByUserId } from "../../api-client/reviews/reviews";
import { getErrorI18nKey } from "../../lib/api-errors";
import { requireAudience } from "../../lib/route-guards";

export const Route = createFileRoute("/driver/profile")({
    beforeLoad: requireAudience(["user"]),
    component: DriverProfilePage,
});

export function DriverProfilePage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { language, theme, onLanguageChange, onThemeToggle } = useLayout();
    const { data: session } = authClient.useSession();
    const user = session?.user;
    const userId = user?.id;
    const userName = user ? getDisplayName(user) : undefined;
    const userEmail = user?.email;
    const userBio = user?.bio ?? undefined;
    const userCreatedAt = user?.createdAt;
    const displayName = userName ?? t("profile.fallbackName");
    const displayEmail = userEmail ?? "";
    const memberSince = formatMemberSince(userCreatedAt, language);
    const aboutMe = userBio?.trim();
    const [cancellingRideId, setCancellingRideId] = useState<string | null>(
        null
    );
    const [rideToCancel, setRideToCancel] = useState<string | null>(null);
    const [carToDelete, setCarToDelete] = useState<string | null>(null);
    const deleteCar = useDeleteCar();
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
                duration: formatDuration(
                    ride.departureAt,
                    ride.arrivalEstimateAt
                ),
            };
        }) ?? [];

    function handleConfirmCancel(reason: string) {
        if (!rideToCancel) return;
        setCancellingRideId(rideToCancel);
        setRideToCancel(null);
        cancelRide.mutate(
            { rideId: rideToCancel, reason },
            { onSettled: () => setCancellingRideId(null) }
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
                        navigate({
                            to: "/driver/ratings",
                            search: { view: "received" },
                        })
                    }
                    onEditProfileClick={() =>
                        navigate({
                            to: "/profile/edit",
                            state: { role: "driver" },
                        })
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
                                        duration={ride.duration}
                                        onViewPassengers={() =>
                                            navigate({
                                                to: "/driver/rides/passengers",
                                                state: { ride },
                                            })
                                        }
                                        onCancelRide={() =>
                                            setRideToCancel(ride.id)
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
                                                ? t("driverRides.cancelling")
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
                                    navigate({
                                        to: "/car/add",
                                        state: { role: "driver" },
                                    })
                                }
                            >
                                {t("profile.addCar")}
                            </Button>
                        </div>
                        {carsQuery.isLoading && (
                            <p className="text-(--color-text-secondary)">
                                {t("profile.loadingCars")}
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
                                    {t("profile.noCars")}
                                </p>
                            )}
                        {carsQuery.data?.map((car) => (
                            <CarCard
                                key={car.id}
                                model={`${car.brand} ${car.modelName}`}
                                onDelete={() => setCarToDelete(car.id)}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <Modal
                open={carToDelete !== null}
                onClose={() => setCarToDelete(null)}
            >
                <h2 className="text-xl font-bold text-(--color-text-primary) mb-2">
                    {t("profile.deleteCar.title")}
                </h2>
                <p className="text-sm text-(--color-text-secondary) mb-8 leading-relaxed">
                    {t("profile.deleteCar.message")}
                </p>
                <div className="flex gap-3 justify-end">
                    <Button
                        variant="secondary"
                        onClick={() => setCarToDelete(null)}
                    >
                        {t("profile.deleteCar.cancel")}
                    </Button>
                    <Button
                        variant="unstyled"
                        disabled={deleteCar.isPending}
                        className="px-4 py-3 rounded-xl font-semibold text-sm text-white cursor-pointer disabled:opacity-50"
                        style={{ background: "var(--color-red)" }}
                        onClick={() => {
                            if (carToDelete) deleteCar.mutate(carToDelete);
                        }}
                    >
                        {t("profile.deleteCar.confirm")}
                    </Button>
                </div>
            </Modal>

            <CancelRideDialog
                open={rideToCancel !== null}
                loading={cancelRide.isPending}
                onOpenChange={(open) => {
                    if (!open) setRideToCancel(null);
                }}
                onConfirm={handleConfirmCancel}
            />
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
