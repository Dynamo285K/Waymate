import { Elysia } from "elysia";
import { ReviewService } from "./review.service";
import { isFullyOnboarded } from "../auth/auth.middleware";
import { ReviewErrors } from "./review.errors";
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
    .onError(({ code, status }) => {
        if (code === "VALIDATION" || code === "PARSE") {
            return status(400, { error: "Invalid request data" });
        }
        if (code === 401) {
            return status(401, { error: "Unauthorized" });
        }
        if (code === "INTERNAL_SERVER_ERROR" || code === "UNKNOWN") {
            return status(500, { error: "Internal server error" });
        }
    })
    .use(isFullyOnboarded)
    .guard({ auth: true, onboarded: true }, (app) =>
        app
            .post(
                "/",
                async ({ user, body, status }) => {
                    try {
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
                    } catch (error) {
                        const message =
                            error instanceof Error
                                ? error.message
                                : String(error);

                        if (message === ReviewErrors.RideNotFound) {
                            return status(404, { error: "Ride not found" });
                        }
                        if (message === ReviewErrors.RideNotCompleted) {
                            return status(400, {
                                error: "Reviews can only be submitted for completed rides",
                            });
                        }
                        if (message === ReviewErrors.RatingWindowClosed) {
                            return status(400, {
                                error: "The rating period for this ride has expired",
                            });
                        }
                        if (message === ReviewErrors.SelfReviewNotAllowed) {
                            return status(400, {
                                error: "You cannot review yourself",
                            });
                        }
                        if (message === ReviewErrors.AuthorNotInRide) {
                            return status(403, {
                                error: "You did not participate in this ride",
                            });
                        }
                        if (message === ReviewErrors.SubjectNotInRide) {
                            return status(400, {
                                error: "The reviewed user did not participate in this ride",
                            });
                        }
                        if (message === ReviewErrors.InvalidPairing) {
                            return status(400, {
                                error: "Only the driver and a passenger may review each other",
                            });
                        }
                        if (message === ReviewErrors.AlreadyExists) {
                            return status(409, {
                                error: "You have already reviewed this user for this ride",
                            });
                        }

                        return status(500, {
                            error: "Failed to submit review",
                        });
                    }
                },
                {
                    body: "CreateReviewBody",
                    response: {
                        201: "ReviewActionResponse",
                        400: "ErrorResponse",
                        403: "ErrorResponse",
                        404: "ErrorResponse",
                        409: "ErrorResponse",
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
                        500: "ErrorResponse",
                    },
                    detail: {
                        description:
                            "Returns reviews authored by the current user",
                    },
                }
            )
    );
