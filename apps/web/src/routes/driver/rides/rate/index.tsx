import { useTranslation } from "react-i18next";
import {
    createFileRoute,
    useNavigate,
    useLocation,
} from "@tanstack/react-router";
import {
    DollarIcon,
    MapIcon,
    RatePassengerCard,
    StatCard,
    TextLink,
    UsersIcon,
} from "@waymate/ui";
import { useGetRidesByIdPassengers } from "../../../../api-client/rides/rides";
import { useSubmitReview } from "../../../../hooks/shared/useSubmitReview";
import { getErrorI18nKey } from "../../../../lib/api-errors";
import { useLayout } from "../../../../lib/use-layout";

export const Route = createFileRoute("/driver/rides/rate/")({
    component: DriverRatePassengersPage,
});

function StatVisual({
    tone,
    children,
}: {
    tone: "success" | "danger" | "primary";
    children: React.ReactNode;
}) {
    const toneClass = {
        success:
            "bg-success-bg text-success-text icon-svg:text-success-text icon-svg:stroke-current",
        danger: "bg-danger-bg text-danger-text icon-svg:text-danger-text icon-svg:stroke-current",
        primary:
            "bg-primary/10 text-primary icon-svg:text-primary icon-svg:stroke-current",
    }[tone];

    return (
        <div
            className={`w-full h-full ${toneClass} rounded-xl flex items-center justify-center`}
        >
            {children}
        </div>
    );
}

function DriverRatePassengersPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { theme } = useLayout();
    const location = useLocation();
    const ride = location.state.ride;

    const passengersQuery = useGetRidesByIdPassengers(ride?.id ?? "", {
        query: { enabled: Boolean(ride?.id) },
    });
    const submitReview = useSubmitReview();

    const passengers = passengersQuery.data?.passengers ?? [];
    const totalEarned = passengers.reduce((sum, p) => sum + p.priceAmount, 0);

    return (
        <div
            data-theme={theme}
            className="min-h-screen bg-background"
        >
            <section className="w-full px-4 sm:max-w-3xl sm:mx-auto sm:px-8 py-8 sm:py-12">
                <div className="text-sm mb-4">
                    <TextLink
                        variant="muted"
                        onClick={() => {
                            navigate({
                                to: "/driver/rides",
                                search: { tab: "past" },
                            });
                        }}
                    >
                        {t("driverRides.backToMyRides")}
                    </TextLink>
                </div>

                <h1 className="text-2xl font-bold text-text-primary mb-6">
                    {t("driverRides.ratePassengersTitle")}
                </h1>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    <StatCard
                        icon={
                            <StatVisual tone="success">
                                <MapIcon />
                            </StatVisual>
                        }
                        value={ride ? `${ride.from} → ${ride.to}` : "—"}
                        label={
                            t("driverRides.kmTraveled", { km: "" })
                                .replace("km", "")
                                .trim() || "route"
                        }
                    />
                    <StatCard
                        icon={
                            <StatVisual tone="danger">
                                <DollarIcon />
                            </StatVisual>
                        }
                        value={`${totalEarned}€`}
                        label={
                            t("driverRides.earned", { amount: "" })
                                .replace("€", "")
                                .trim() || "earned"
                        }
                    />
                    <StatCard
                        icon={
                            <StatVisual tone="primary">
                                <UsersIcon />
                            </StatVisual>
                        }
                        value={String(passengers.length)}
                        label={t("driverRides.passengers")}
                    />
                </div>

                {!ride?.id && (
                    <p className="text-text-secondary">
                        {t("driverRides.passengersError")}
                    </p>
                )}

                {passengersQuery.isLoading && (
                    <p className="text-text-secondary">
                        {t("driverRides.loading")}
                    </p>
                )}

                {passengersQuery.isError && (
                    <p className="text-text-secondary">
                        {t(
                            getErrorI18nKey(
                                passengersQuery.error,
                                {},
                                "driverRides.passengersError"
                            )
                        )}
                    </p>
                )}

                {!passengersQuery.isLoading &&
                    !passengersQuery.isError &&
                    passengers.length === 0 &&
                    ride?.id && (
                        <p className="text-text-secondary">
                            {t("driverRides.noPassengers")}
                        </p>
                    )}

                <div className="flex flex-col gap-4">
                    {passengers.map((booking) => {
                        const passengerName =
                            `${booking.passenger.firstName ?? ""} ${booking.passenger.lastName ?? ""}`.trim() ||
                            t("roles.passenger");
                        const submittedRating =
                            booking.myReviewOfPassenger?.rating ?? null;
                        const isSubmitting =
                            submitReview.isPending &&
                            submitReview.variables?.data.subjectId ===
                                booking.passenger.id;

                        return (
                            <RatePassengerCard
                                key={booking.bookingId}
                                name={passengerName}
                                submittedRating={submittedRating}
                                isSubmitting={isSubmitting}
                                onSubmit={(rating, review) => {
                                    if (!ride?.id) return;
                                    submitReview.mutate(
                                        {
                                            data: {
                                                rideId: ride.id,
                                                subjectId: booking.passenger.id,
                                                rating,
                                                comment: review || undefined,
                                            },
                                        },
                                        {
                                            onSuccess: () => {
                                                submitReview.reset();
                                            },
                                        }
                                    );
                                }}
                                labels={{
                                    placeholder: t("driverRides.writeReview"),
                                    submitRating: t("driverRides.submitRating"),
                                }}
                            />
                        );
                    })}
                </div>
            </section>
        </div>
    );
}
