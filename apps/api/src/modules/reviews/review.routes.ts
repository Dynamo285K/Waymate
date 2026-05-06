import { Elysia } from "elysia";
import { ReviewService } from "./review.service";
import { isFullyOnboarded } from "../auth/auth.middleware";
import { createErrorHandler } from "../auth/auth.errors";
import { ReviewError, reviewErrorToHttpStatus } from "./review.errors";
import {
    ErrorResponseSchema,
    AuthoredReviewListSchema,
    CreateReviewBodySchema,
    ReviewActionResponseSchema,
    ReviewIdParamsSchema,
    SubjectUserIdParamsSchema,
    UserReviewsViewSchema,
} from "@repo/shared";

export const ReviewRoutes = new Elysia({
    prefix: "/reviews",
    tags: ["Reviews"],
})
    .model({
        ReviewIdParams: ReviewIdParamsSchema,
        SubjectUserIdParams: SubjectUserIdParamsSchema,
        CreateReviewBody: CreateReviewBodySchema,
        ReviewActionResponse: ReviewActionResponseSchema,
        UserReviewsView: UserReviewsViewSchema,
        AuthoredReviewList: AuthoredReviewListSchema,
        ErrorResponse: ErrorResponseSchema,
    })
    .onError(createErrorHandler(ReviewError, reviewErrorToHttpStatus))
    .use(isFullyOnboarded)
    .guard({ auth: true, onboarded: true }, (app) =>
        app
            .post(
                "/",
                async ({ user, body, status }) => {
                    const review = await ReviewService.submitReview({
                        rideId: body.rideId,
                        authorId: user.id,
                        subjectId: body.subjectId,
                        rating: body.rating,
                        comment: body.comment ?? null,
                    });

                    return status(201, {
                        id: review.id,
                        reviewStatus: review.reviewStatus,
                    });
                },
                {
                    body: "CreateReviewBody",
                    response: {
                        201: "ReviewActionResponse",
                        400: "ErrorResponse",
                        403: "ErrorResponse",
                        404: "ErrorResponse",
                        409: "ErrorResponse",
                        413: "ErrorResponse",
                        429: "ErrorResponse",
                        500: "ErrorResponse",
                    },
                    detail: {
                        description:
                            "Submit a 1-5 star review with an optional comment for a co-traveller of a completed ride",
                    },
                }
            )

            .get(
                "/users/:userId",
                async ({ params }) => {
                    const result = await ReviewService.getReviewsForUser(
                        params.userId
                    );

                    return {
                        subjectId: params.userId,
                        averageRating: result.averageRating,
                        reviewCount: result.reviewCount,
                        reviews: result.reviews,
                    };
                },
                {
                    params: SubjectUserIdParamsSchema,
                    response: {
                        200: "UserReviewsView",
                        429: "ErrorResponse",
                        500: "ErrorResponse",
                    },
                    detail: {
                        description:
                            "Returns visible reviews and the average rating for a target user",
                    },
                }
            )

            .get(
                "/me/authored",
                async ({ user }) => {
                    return await ReviewService.getMyAuthoredReviews(user.id);
                },
                {
                    response: {
                        200: "AuthoredReviewList",
                        429: "ErrorResponse",
                        500: "ErrorResponse",
                    },
                    detail: {
                        description:
                            "Returns reviews authored by the current user",
                    },
                }
            )
    );
