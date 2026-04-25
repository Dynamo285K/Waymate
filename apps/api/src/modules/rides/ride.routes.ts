import { Elysia } from "elysia";
import { z } from "zod";
import { RideService } from "./ride.service";
import { isFullyOnboarded } from "../auth/auth.middleware";
import { RideErrors } from "./ride.errors";

import { ErrorResponseSchema } from "../../shared";
import {
    RideSchema,
    CreateRideBodySchema,
    SearchRidesQuerySchema,
    RideSearchResultItemSchema,
    RideIdParamsSchema,
    CancelRideBodySchema,
    TimeframeQuerySchema,
} from "./ride.schema";

export const RideRoutes = new Elysia({ prefix: "/rides", tags: ["Rides"] })
    .model({
        Ride: RideSchema,
        CreateRideBody: CreateRideBodySchema,
        SearchRidesQuery: SearchRidesQuerySchema,
        RideSearchResultList: RideSearchResultItemSchema.array(),
        CancelRideBody: CancelRideBodySchema,
        RideIdParams: RideIdParamsSchema,
        TimeframeQuery: TimeframeQuerySchema,
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
            // ==========================================
            // 1. STATIC ROUTES (must be defined before /:id routes)
            // ==========================================

            .get(
                "/search",
                async ({ query }) => {
                    return await RideService.searchRides(query);
                },
                {
                    query: "SearchRidesQuery",
                    response: {
                        200: "RideSearchResultList",
                    },
                    detail: {
                        description:
                            "Search rides between two cities on a specific date",
                    },
                }
            )

            .get(
                "/me",
                async ({ user, query }) => {
                    return await RideService.getDriverRides(
                        user.id,
                        query.timeframe as "UPCOMING" | "PAST" | "ALL"
                    );
                },
                {
                    query: "TimeframeQuery",
                    detail: {
                        description:
                            "Returns rides created by the authenticated driver",
                    },
                }
            )

            .post(
                "/",
                async ({ user, body, status }) => {
                    try {
                        const rideId = await RideService.createRide(
                            user.id,
                            body
                        );
                        return status(201, { id: rideId });
                    } catch (error) {
                        const message =
                            error instanceof Error
                                ? error.message
                                : String(error);

                        console.error("Error while creating ride:", error);

                        if (message === RideErrors.CarNotAvailableForDriver) {
                            return status(403, {
                                error: "Car not found, not active, or does not belong to you",
                            });
                        }

                        if (message === RideErrors.InvalidPriceStopOrders) {
                            return status(400, {
                                error: "Invalid stop orders in prices configuration",
                            });
                        }

                        return status(500, { error: "Failed to create ride" });
                    }
                },
                {
                    body: "CreateRideBody",
                    response: {
                        201: z.object({ id: z.string() }),
                        400: "ErrorResponse",
                        403: "ErrorResponse",
                        500: "ErrorResponse",
                    },
                    detail: {
                        description: "Creates a new ride as a driver",
                    },
                }
            )

            // ==========================================
            // 2. DYNAMIC ROUTES (contain /:id)
            // ==========================================

            .get(
                "/:id/passengers",
                async ({ user, params, status }) => {
                    const view = await RideService.getRidePassengers(
                        params.id,
                        user.id
                    );

                    if (!view) {
                        return status(404, { error: "Ride not found" });
                    }

                    return view;
                },
                {
                    params: "RideIdParams",
                    detail: {
                        description:
                            "Returns ride details including all confirmed passengers",
                    },
                }
            )

            .patch(
                "/:id/cancel",
                async ({ user, params, body, status }) => {
                    try {
                        const cancelledId = await RideService.cancelRide(
                            params.id,
                            user.id,
                            body.reason
                        );
                        return { id: cancelledId, status: "CANCELLED" };
                    } catch (error) {
                        const message =
                            error instanceof Error
                                ? error.message
                                : String(error);

                        if (message === RideErrors.RideNotFoundOrNotOwner) {
                            return status(404, { error: "Ride not found" });
                        }
                        if (message === RideErrors.RideAlreadyCancelled) {
                            return status(400, {
                                error: "Ride is already cancelled",
                            });
                        }

                        return status(500, { error: "Failed to cancel ride" });
                    }
                },
                {
                    params: "RideIdParams",
                    body: "CancelRideBody",
                    response: {
                        200: z.object({ id: z.string(), status: z.string() }),
                        400: "ErrorResponse",
                        404: "ErrorResponse",
                        500: "ErrorResponse",
                    },
                    detail: {
                        description:
                            "Cancels a ride and cascades cancellation to all active passenger bookings",
                    },
                }
            )
    );
