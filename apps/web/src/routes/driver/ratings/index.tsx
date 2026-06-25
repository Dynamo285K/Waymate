import { useTranslation } from "react-i18next";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { RatingSummaryCard, RatingCard, TextLink } from "@waymate/ui";
import {
    useGetReviewsMeAuthored,
    useGetReviewsUsersByUserId,
    getGetReviewsMeAuthoredQueryOptions,
} from "../../../api-client/reviews/reviews";
import { getErrorI18nKey } from "../../../lib/api-errors";
import { ratingsSearchSchema } from "../../../lib/ratings-search-schema";
import { authClient } from "../../../lib/auth-client";
import { useLayout } from "../../../lib/use-layout";

export const Route = createFileRoute("/driver/ratings/")({
    validateSearch: ratingsSearchSchema,
    // Warm the React Query cache from the router loader so the authored-reviews
    // fetch starts before the component mounts. The component reads the same
    // query via useGetReviewsMeAuthored. The received-reviews query stays in the
    // component because it depends on the client-resolved session user id.
    loader: ({ context: { queryClient } }) =>
        queryClient.ensureQueryData(getGetReviewsMeAuthoredQueryOptions()),
    component: DriverRatingsPage,
});

function DriverRatingsPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { theme } = useLayout();
    const { data: session } = authClient.useSession();
    const user = session?.user;
    const userId = user?.id;
    const search = Route.useSearch();
    const view = search.view === "authored" ? "authored" : "received";
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
    const error = isReceived ? receivedReviews.error : authoredReviews.error;
    const ratings = isReceived
        ? (receivedReviews.data?.reviews.map((review) => ({
              id: review.id,
              name: formatName(review.author.firstName, review.author.lastName),
              rating: review.rating,
              review: review.comment ?? "",
              originCity: review.ride.originCity,
              destinationCity: review.ride.destinationCity,
          })) ?? [])
        : (authoredReviews.data?.map((review) => ({
              id: review.id,
              name: formatName(
                  review.subject.firstName,
                  review.subject.lastName
              ),
              rating: review.rating,
              review: review.comment ?? "",
              originCity: review.ride.originCity,
              destinationCity: review.ride.destinationCity,
          })) ?? []);
    const averageRating = isReceived
        ? (receivedReviews.data?.averageRating ?? 0)
        : ratings.length > 0
          ? ratings.reduce((sum, item) => sum + item.rating, 0) / ratings.length
          : 0;

    return (
        <div
            data-theme={theme}
            className="min-h-screen bg-background"
        >
            <section className="w-full px-4 sm:max-w-3xl sm:mx-auto sm:px-8 py-8 sm:py-12">
                <div className="text-sm mb-4">
                    <TextLink
                        variant="muted"
                        onClick={() => navigate({ to: "/driver/profile" })}
                    >
                        {t("profile.backToProfile")}
                    </TextLink>
                </div>

                <h1 className="text-2xl font-bold text-text-primary mb-6">
                    {isReceived ? t("ratings.title") : t("ratings.myRatings")}
                </h1>

                <RatingSummaryCard
                    rating={Number(averageRating.toFixed(1))}
                    totalRatings={ratings.length}
                    totalRatingsLabel={t("ratings.totalRatings")}
                />

                <div className="flex flex-col gap-4 mt-6">
                    {isLoading && (
                        <p className="text-text-secondary">
                            {t("ratings.loading")}
                        </p>
                    )}
                    {isError && (
                        <p className="text-text-secondary">
                            {t(getErrorI18nKey(error, {}, "ratings.error"))}
                        </p>
                    )}
                    {!isLoading && !isError && ratings.length === 0 && (
                        <p className="text-text-secondary">
                            {t("ratings.empty")}
                        </p>
                    )}
                    {!isLoading &&
                        !isError &&
                        ratings.map((rating) => (
                            <RatingCard
                                key={rating.id}
                                name={rating.name}
                                from={rating.originCity}
                                to={rating.destinationCity}
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
