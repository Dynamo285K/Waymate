import { useTranslation } from "react-i18next";
import {
    createFileRoute,
    useNavigate,
    useLocation,
} from "@tanstack/react-router";
import { RatePassengerCard, StatCard, TextLink } from "@waymate/ui";
import { DriverNavbar } from "../../../components/navigation/DriverNavbar";
import { useDriverNavbarProps } from "../../../features/driver/hooks/useDriverNavbarProps";
import { useGetRidesByIdPassengers } from "../../../api-client/rides/rides";
import { useSubmitReview } from "../../../hooks/shared/useSubmitReview";
import { getErrorI18nKey } from "../../../lib/api-errors";
import { authClient } from "../../../lib/auth-client";
import { getDisplayName } from "../../../lib/session-user";
import { requireAudience } from "../../../lib/route-guards";
import { useLayout } from "../../../lib/use-layout";

export const Route = createFileRoute("/driver/rides/rate")({
    beforeLoad: requireAudience(["user"]),
    component: DriverRatePassengersPage,
});

function MapIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
            <line
                x1="9"
                y1="3"
                x2="9"
                y2="18"
            />
            <line
                x1="15"
                y1="6"
                x2="15"
                y2="21"
            />
        </svg>
    );
}
function DollarIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <line
                x1="12"
                y1="1"
                x2="12"
                y2="23"
            />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
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

function DriverRatePassengersPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { language, theme, onLanguageChange, onThemeToggle } = useLayout();
    const { data: session } = authClient.useSession();
    const user = session?.user;
    const userName = user ? getDisplayName(user) : undefined;
    const userEmail = user?.email;
    const navbarProps = useDriverNavbarProps({
        activeTab: "my-rides",
        language,
        onLanguageChange,
        theme,
        onThemeToggle,
        userName,
        userEmail,
    });
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
            className="min-h-screen bg-(--color-bg)"
        >
            <DriverNavbar {...navbarProps} />

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

                <h1 className="text-2xl font-bold text-(--color-text-primary) mb-6">
                    {t("driverRides.ratePassengersTitle")}
                </h1>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    <StatCard
                        icon={
                            <IconBox
                                bg="bg-(--color-success-bg)"
                                color="text-(--color-success-text)"
                            >
                                <MapIcon />
                            </IconBox>
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
                            <IconBox
                                bg="bg-(--color-danger-bg)"
                                color="text-(--color-danger-text)"
                            >
                                <DollarIcon />
                            </IconBox>
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
                            <IconBox
                                bg="bg-(--color-primary)/10"
                                color="text-(--color-primary)"
                            >
                                <UsersIcon />
                            </IconBox>
                        }
                        value={String(passengers.length)}
                        label={t("driverRides.passengers")}
                    />
                </div>

                {!ride?.id && (
                    <p className="text-(--color-text-secondary)">
                        {t("driverRides.passengersError")}
                    </p>
                )}

                {passengersQuery.isLoading && (
                    <p className="text-(--color-text-secondary)">
                        {t("driverRides.loading")}
                    </p>
                )}

                {passengersQuery.isError && (
                    <p className="text-(--color-text-secondary)">
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
                        <p className="text-(--color-text-secondary)">
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
