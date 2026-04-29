import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "../lib/router-compat";
import { PassengerNavbar, RatingSummaryCard, RatingCard } from "@waymate/ui";
import type { Language } from "@waymate/ui";
import { useLogout } from "../hooks/useLogout";
import {
    useGetReviewsMeAuthored,
    useGetReviewsUsersByUserId,
} from "../api-client/reviews/reviews";

type PassengerRatingsPageProps = {
    language: Language;
    theme: "light" | "dark";
    onLanguageChange: (lang: Language) => void;
    onThemeToggle: () => void;
    userId?: string;
    userName?: string;
    userEmail?: string;
};

export function PassengerRatingsPage({
    language,
    theme,
    onLanguageChange,
    onThemeToggle,
    userId,
    userName,
    userEmail,
}: PassengerRatingsPageProps) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const navbarProps = usePassengerNavbarProps({
        activeTab: "find-ride",
        language,
        onLanguageChange,
        theme,
        onThemeToggle,
        userName,
        userEmail,
    });
    const [searchParams] = useSearchParams();
    const view =
        searchParams.get("view") === "received" ? "received" : "authored";
    const receivedReviews = useGetReviewsUsersByUserId(userId ?? "", {
        query: { enabled: Boolean(userId) },
    });
    const authoredReviews = useGetReviewsMeAuthored();
    const isReceived = view === "received";
    const isLoading = isReceived
        ? receivedReviews.isLoading
        : authoredReviews.isLoading;
    const isError = isReceived
        ? receivedReviews.isError
        : authoredReviews.isError;
    const ratings = isReceived
        ? (receivedReviews.data?.reviews.map((review) => ({
              id: review.id,
              name: formatName(review.author.firstName, review.author.lastName),
              rating: review.rating,
              review: review.comment ?? "",
              rideId: review.rideId,
          })) ?? [])
        : (authoredReviews.data?.map((review) => ({
              id: review.id,
              name: formatName(
                  review.subject.firstName,
                  review.subject.lastName
              ),
              rating: review.rating,
              review: review.comment ?? "",
              rideId: review.rideId,
          })) ?? []);
    const averageRating = isReceived
        ? (receivedReviews.data?.averageRating ?? 0)
        : ratings.length > 0
          ? ratings.reduce((sum, item) => sum + item.rating, 0) / ratings.length
          : 0;

    return (
        <div
            data-theme={theme}
            className="min-h-screen bg-(--color-bg)"
        >
            <PassengerNavbar {...navbarProps} />

            <section className="w-full px-4 sm:max-w-3xl sm:mx-auto sm:px-8 py-8 sm:py-12">
                <button
                    onClick={() => navigate("/passenger/profile")}
                    className="text-(--color-text-secondary) text-sm mb-4 hover:text-(--color-text-primary) transition-colors"
                >
                    {t("profile.backToProfile")}
                </button>

                <h1 className="text-2xl font-bold text-(--color-text-primary) mb-6">
                    {isReceived
                        ? t("ratings.title")
                        : t("ratings.myRatings", "My ratings")}
                </h1>

                <RatingSummaryCard
                    rating={Number(averageRating.toFixed(1))}
                    totalRatings={ratings.length}
                    totalRatingsLabel={t("ratings.totalRatings")}
                />

                <div className="flex flex-col gap-4 mt-6">
                    {isLoading && (
                        <p className="text-(--color-text-secondary)">
                            {t("ratings.loading", "Loading ratings...")}
                        </p>
                    )}
                    {isError && (
                        <p className="text-(--color-text-secondary)">
                            {t("ratings.error", "Could not load ratings.")}
                        </p>
                    )}
                    {!isLoading && !isError && ratings.length === 0 && (
                        <p className="text-(--color-text-secondary)">
                            {t("ratings.empty", "No ratings yet.")}
                        </p>
                    )}
                    {!isLoading &&
                        !isError &&
                        ratings.map((rating) => (
                            <RatingCard
                                key={rating.id}
                                name={rating.name}
                                from={t("ratings.ride", "Ride")}
                                to={rating.rideId.slice(0, 8)}
                                rating={rating.rating}
                                review={rating.review}
                            />
                        ))}
                </div>
            </section>
        </div>
    );
}

function formatName(firstName: string | null, lastName: string | null) {
    return [firstName, lastName].filter(Boolean).join(" ").trim() || "User";
}
