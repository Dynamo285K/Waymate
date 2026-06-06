import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "../../../lib/router-compat";
import { ProfileHeroCard } from "@waymate/ui";
import { CancelRideDialog } from "../../../components/CancelRideDialog";
import { useCancelBooking } from "../hooks/useCancelBooking";
import type { Language } from "../../../components/controls/LanguageSwitcher";
import { PassengerNavbar } from "../../../components/navigation/PassengerNavbar";
import { RideCard } from "../../../components/RideCard";
import { useGetBookingsMe } from "../../../api-client/bookings/bookings";
import { useGetReviewsUsersByUserId } from "../../../api-client/reviews/reviews";
import { getErrorI18nKey } from "../../../lib/api-errors";
import { formatRideDate, formatDuration } from "../../../lib/date-format";
import { usePassengerNavbarProps } from "../../../hooks/usePassengerNavbarProps";

type PassengerProfilePageProps = {
    language: Language;
    theme: "light" | "dark";
    onLanguageChange: (lang: Language) => void;
    onThemeToggle: () => void;
    userName?: string;
    userEmail?: string;
    userBio?: string;
    userCreatedAt?: string | Date;
    userId?: string;
};

export function PassengerProfilePage({
    language,
    theme,
    onLanguageChange,
    onThemeToggle,
    userName,
    userEmail,
    userBio,
    userCreatedAt,
    userId,
}: PassengerProfilePageProps) {
    const { t } = useTranslation();
    const navigate = useNavigate();
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
            driverRating: 0,
            seatsLeft: booking.seatsLeft,
            status:
                booking.bookingStatus === "CONFIRMED"
                    ? ("confirmed" as const)
                    : ("pending" as const),
        })) ?? [];

    return (
        <div
            data-theme={theme}
            className="min-h-screen bg-(--color-bg)"
        >
            <PassengerNavbar {...navbarProps} />

            <div className="w-full px-4 sm:max-w-5xl sm:mx-auto sm:px-8 py-8 sm:py-12 flex flex-col gap-6">
                <ProfileHeroCard
                    name={displayName}
                    email={displayEmail}
                    rating={profileRating}
                    memberSince={memberSince}
                    onViewRatingsClick={() =>
                        navigate("/passenger/ratings?view=received")
                    }
                    onEditProfileClick={() =>
                        navigate("/profile/edit", {
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
                    <div className="bg-(--color-card) rounded-2xl p-6 border border-(--color-border)">
                        <h2 className="text-base font-semibold text-(--color-text-primary) mb-3">
                            {t("profile.aboutMe")}
                        </h2>
                        <p className="text-(--color-text-secondary) text-sm leading-relaxed">
                            {aboutMe}
                        </p>
                    </div>
                )}

                <div className="flex flex-col gap-4">
                    <h2 className="text-lg font-bold text-(--color-text-primary)">
                        {t("profile.myUpcomingRides")}
                    </h2>

                    {ridesLoading && (
                        <p className="text-(--color-text-secondary)">
                            {t("myRides.loading")}
                        </p>
                    )}

                    {ridesError && (
                        <p className="text-(--color-text-secondary)">
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
                            <p className="text-(--color-text-secondary)">
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
