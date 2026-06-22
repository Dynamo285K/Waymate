import { useState } from "react";
import { useTranslation } from "react-i18next";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ProfileHeroCard } from "@waymate/ui";
import { authClient } from "../../../lib/auth-client";
import { getDisplayName } from "../../../lib/session-user";
import { useLayout } from "../../../lib/use-layout";
import { BlockedUsersSection } from "../../../components/shared/BlockedUsersSection";
import { useCancelRide } from "../../../features/driver/hooks/useCancelRide";
import { useDeleteCar } from "./-hooks/useDeleteCar";
import { CancelRideDialog } from "../../../components/shared/CancelRideDialog";
import { useGetRidesMe } from "../../../api-client/rides/rides";
import { useGetCarsMe } from "../../../api-client/cars/cars";
import { useGetReviewsUsersByUserId } from "../../../api-client/reviews/reviews";
import {
    formatMemberSince,
    mapUpcomingRides,
    type UpcomingRide,
} from "./-lib/driver-profile";
import { UpcomingRidesColumn } from "./-components/UpcomingRidesColumn";
import { MyCarsColumn } from "./-components/MyCarsColumn";
import { DeleteCarModal } from "./-components/DeleteCarModal";

export const Route = createFileRoute("/driver/profile/")({
    component: DriverProfilePage,
});

function DriverProfilePage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { language, theme } = useLayout();
    const { data: session } = authClient.useSession();
    const user = session?.user;
    const userId = user?.id;

    const displayName = user ? getDisplayName(user) : t("profile.fallbackName");
    const displayEmail = user?.email ?? "";
    const memberSince = formatMemberSince(user?.createdAt, language);
    const aboutMe = user?.bio?.trim();

    const [cancellingRideId, setCancellingRideId] = useState<string | null>(
        null
    );
    const [rideToCancel, setRideToCancel] = useState<string | null>(null);
    const [carToDelete, setCarToDelete] = useState<string | null>(null);

    const deleteCar = useDeleteCar();
    const cancelRide = useCancelRide();
    const carsQuery = useGetCarsMe();
    const {
        data: rides,
        isLoading: ridesLoading,
        isError: ridesError,
        error: ridesErrorObj,
    } = useGetRidesMe({ timeframe: "UPCOMING" });
    const { data: receivedReviews } = useGetReviewsUsersByUserId(userId ?? "", {
        query: { enabled: Boolean(userId) },
    });

    const profileRating =
        receivedReviews?.averageRating != null
            ? receivedReviews.averageRating.toFixed(1)
            : "0.0";
    const upcomingRides = mapUpcomingRides(rides);

    function handleConfirmCancel(reason: string) {
        if (!rideToCancel) return;
        setCancellingRideId(rideToCancel);
        setRideToCancel(null);
        cancelRide.mutate(
            { rideId: rideToCancel, reason },
            { onSettled: () => setCancellingRideId(null) }
        );
    }

    function handleViewPassengers(ride: UpcomingRide) {
        navigate({ to: "/driver/rides/passengers", state: { ride } });
    }

    return (
        <div
            data-theme={theme}
            className="min-h-screen bg-background"
        >
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
                    <div className="bg-card rounded-2xl p-6 border border-border">
                        <h2 className="text-base font-semibold text-text-primary mb-3">
                            {t("profile.aboutMe")}
                        </h2>
                        <p className="text-text-secondary text-sm leading-relaxed">
                            {aboutMe}
                        </p>
                    </div>
                )}

                <BlockedUsersSection />

                <div className="flex flex-col lg:flex-row gap-6">
                    <UpcomingRidesColumn
                        rides={upcomingRides}
                        loading={ridesLoading}
                        ridesError={ridesError ? ridesErrorObj : null}
                        cancelIsError={cancelRide.isError}
                        cancelError={cancelRide.error}
                        cancelPending={cancelRide.isPending}
                        cancellingRideId={cancellingRideId}
                        onViewPassengers={handleViewPassengers}
                        onCancelRide={setRideToCancel}
                    />

                    <MyCarsColumn
                        cars={carsQuery.data}
                        loading={carsQuery.isLoading}
                        error={carsQuery.isError ? carsQuery.error : null}
                        onAddCar={() =>
                            navigate({
                                to: "/car/add",
                                state: { role: "driver" },
                            })
                        }
                        onDeleteCar={setCarToDelete}
                    />
                </div>
            </div>

            <DeleteCarModal
                open={carToDelete !== null}
                pending={deleteCar.isPending}
                onClose={() => setCarToDelete(null)}
                onConfirm={() => {
                    if (carToDelete) deleteCar.mutate(carToDelete);
                }}
            />

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
