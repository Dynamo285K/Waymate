import { useState } from "react";
import { useTranslation } from "react-i18next";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ProfileHeroCard } from "@waymate/ui";
import { CancelRideDialog } from "../../components/shared/CancelRideDialog";
import { useCancelBooking } from "../../features/passenger/hooks/useCancelBooking";
import type { Language } from "../../components/controls/LanguageSwitcher";
import { PassengerNavbar } from "../../components/navigation/PassengerNavbar";
import { RideCard } from "../../components/shared/RideCard";
import { BlockedUsersSection } from "../../components/shared/BlockedUsersSection";
import { useGetBookingsMe } from "../../api-client/bookings/bookings";
import { useGetReviewsUsersByUserId } from "../../api-client/reviews/reviews";
import { getErrorI18nKey } from "../../lib/api-errors";
import { formatRideDate, formatDuration } from "../../lib/date-format";
import { usePassengerNavbarProps } from "../../hooks/shared/usePassengerNavbarProps";
import { authClient } from "../../lib/auth-client";
import { getDisplayName } from "../../lib/session-user";
import { requireAudience } from "../../lib/route-guards";
import { useLayout } from "../../lib/use-layout";

export const Route = createFileRoute("/passenger/profile")({
    beforeLoad: requireAudience(["user"]),
    component: PassengerProfilePage,
});

export function PassengerProfilePage() {
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
    const [bookingToCancel, setBookingToCancel] = useState<string | null>(null);
    const cancelBooking = useCancelBooking();
    const navbarProps = usePassengerNavbarProps({
        activeTab: "find-ride",
        language,
        onLanguageChange,
        theme,
        onThemeToggle,
        userName,
        userEmail,
    });
    const displayName = userName ?? t("profile.fallbackName");
    const displayEmail = userEmail ?? "";
    const memberSince = formatMemberSince(userCreatedAt, language);
    const aboutMe = userBio?.trim();
    const {
        data: bookings,
        isLoading: ridesLoading,
        isError: ridesError,
        error: ridesErrorObj,
    } = useGetBookingsMe({ timeframe: "UPCOMING" });
    const { data: receivedReviews } = useGetReviewsUsersByUserId(userId ?? "", {
        query: { enabled: Boolean(userId) },
    });
    const profileRating =
        receivedReviews?.averageRating != null
            ? receivedReviews.averageRating.toFixed(1)
            : "0.0";
    const upcomingRides =
        bookings?.map((booking) => ({
            id: booking.id,
            from: booking.pickupCity,
            to: booking.dropoffCity,
            date: booking.ride.departureAt,
            price: booking.priceAmount,
            duration: formatDuration(
                booking.ride.departureAt,
                booking.ride.arrivalEstimateAt
            ),
            driverName:
                `${booking.driver.firstName ?? ""} ${
                    booking.driver.lastName ?? ""
                }`.trim() || t("roles.driver"),
            driverRating: booking.driver.averageRating ?? 0,
            seatsLeft: booking.seatsLeft,
            status:
                booking.bookingStatus === "CONFIRMED"
                    ? ("confirmed" as const)
                    : ("pending" as const),
        })) ?? [];

    return (
        <div
            data-theme={theme}
            className="min-h-screen bg-background"
        >
            <PassengerNavbar {...navbarProps} />

            <div className="w-full px-4 sm:max-w-5xl sm:mx-auto sm:px-8 py-8 sm:py-12 flex flex-col gap-6">
                <ProfileHeroCard
                    name={displayName}
                    email={displayEmail}
                    rating={profileRating}
                    memberSince={memberSince}
                    onViewRatingsClick={() =>
                        navigate({
                            to: "/passenger/ratings",
                            search: { view: "received" },
                        })
                    }
                    onEditProfileClick={() =>
                        navigate({
                            to: "/profile/edit",
                            state: { role: "passenger" },
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

                <div className="flex flex-col gap-4">
                    <h2 className="text-lg font-bold text-text-primary">
                        {t("profile.myUpcomingRides")}
                    </h2>

                    {ridesLoading && (
                        <p className="text-text-secondary">
                            {t("myRides.loading")}
                        </p>
                    )}

                    {ridesError && (
                        <p className="text-text-secondary">
                            {t(
                                getErrorI18nKey(
                                    ridesErrorObj,
                                    {},
                                    "myRides.error"
                                )
                            )}
                        </p>
                    )}

                    {!ridesLoading &&
                        !ridesError &&
                        upcomingRides.length === 0 && (
                            <p className="text-text-secondary">
                                {t("myRides.noResults")}
                            </p>
                        )}

                    {!ridesLoading &&
                        !ridesError &&
                        upcomingRides.map((ride) => (
                            <RideCard
                                key={ride.id}
                                variant="passenger-upcoming"
                                from={ride.from}
                                to={ride.to}
                                datetime={formatRideDate(
                                    new Date(ride.date),
                                    t("home.at")
                                )}
                                price={ride.price}
                                duration={ride.duration}
                                seatsLeft={ride.seatsLeft}
                                driverName={ride.driverName}
                                driverRating={ride.driverRating}
                                status={ride.status}
                                onCancelBooking={() =>
                                    setBookingToCancel(ride.id)
                                }
                                labels={{
                                    seatsLeft: (count) =>
                                        t("myRides.seatsLeft", {
                                            count,
                                        }),
                                    pendingConfirmation: t(
                                        "myRides.pendingConfirmation"
                                    ),
                                    cancelBooking: t("myRides.cancelBooking"),
                                }}
                            />
                        ))}
                </div>
            </div>

            <CancelRideDialog
                open={bookingToCancel !== null}
                loading={cancelBooking.isPending}
                onOpenChange={(open) => {
                    if (!open) setBookingToCancel(null);
                }}
                onConfirm={(reason) => {
                    if (!bookingToCancel) return;
                    cancelBooking.mutate(bookingToCancel, reason || undefined, {
                        onSettled: () => setBookingToCancel(null),
                    });
                }}
                title={t("cancelBookingDialog.title")}
                message={t("cancelBookingDialog.message")}
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
