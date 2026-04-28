import { useTranslation } from "react-i18next";
import { useNavigate } from "../lib/router-compat";
import { PassengerNavbar, ProfileHeroCard, RideCard } from "@waymate/ui";
import type { Language } from "@waymate/ui";
import { usePassengerBookings } from "../hooks/usePassengerBookings";
import { formatRideDate } from "../lib/date-format";
import { toUiLanguage } from "../lib/language";
import { useLogout } from "../hooks/useLogout";
import { useUserReviews } from "../hooks/useReviews";

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
    const logout = useLogout();
    const displayName = userName ?? t("profile.fallbackName", "User");
    const displayEmail = userEmail ?? "";
    const memberSince = formatMemberSince(userCreatedAt, language);
    const aboutMe =
        userBio?.trim() ||
        t(
            "profile.defaultBio",
            "Easygoing traveler who enjoys meeting new people on the road. Reliable, communicative, and always respectful during rides."
        );
    const {
        data: bookings,
        isLoading: ridesLoading,
        isError: ridesError,
    } = usePassengerBookings("UPCOMING");
    const { data: receivedReviews } = useUserReviews(userId);
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

    const navbarProps = {
        activeTab: "find-ride" as const,
        language: toUiLanguage(language),
        onLanguageChange,
        role: "passenger" as const,
        onRoleChange: (r: "passenger" | "driver") =>
            r === "driver" && navigate("/driver"),
        theme,
        onThemeToggle,
        userName,
        userEmail,
        onLogoClick: () => navigate("/passenger"),
        onFindRideClick: () => navigate("/passenger"),
        onMyRidesClick: () => navigate("/passenger/rides"),
        onChatClick: () => navigate("/passenger/chat"),
        onMessagesClick: () => navigate("/passenger/chat"),
        onRatingsClick: () => navigate("/passenger/ratings?view=authored"),
        onProfileClick: () => navigate("/passenger/profile"),
        onLogoutClick: logout,
        labels: {
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
        },
    };

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

                <div className="bg-(--color-card) rounded-2xl p-6 border border-(--color-border)">
                    <h2 className="text-base font-semibold text-(--color-text-primary) mb-3">
                        {t("profile.aboutMe")}
                    </h2>
                    <p className="text-(--color-text-secondary) text-sm leading-relaxed">
                        {aboutMe}
                    </p>
                </div>

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
                            {t("myRides.error")}
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
                                seatsLeft={ride.seatsLeft}
                                driverName={ride.driverName}
                                driverRating={ride.driverRating}
                                status={ride.status}
                                onCancelBooking={() => {}}
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
