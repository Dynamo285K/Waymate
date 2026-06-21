import { Elysia } from "elysia";
import { RideService } from "./ride.service";
import { auth } from "../auth/auth";
import { isFullyOnboarded } from "../auth/auth.middleware";
import { createErrorHandler } from "../auth/auth.errors";

// /available and /search are public (guests can browse), so we can't use the
// auth guard. Softly resolve the session if a cookie is present — used only to
// hide rides from drivers the viewer has blocked — and never throw on anon.
const resolveViewerId = async (
    request: Request
): Promise<string | undefined> => {
    try {
        const session = await auth.api.getSession({ headers: request.headers });
        return session?.user?.id;
    } catch {
        return undefined;
    }
};
import { RideError, rideErrorToHttpStatus } from "./ride.errors";
import {
    ErrorResponseSchema,
    RideSchema,
    CreateRideBodySchema,
    SearchRidesQuerySchema,
    RideIdParamsSchema,
    CancelRideBodySchema,
    CompleteRideBodySchema,
    EndRideBodySchema,
    TimeframeQuerySchema,
    RideListItemListSchema,
    RidePassengersViewSchema,
    RideSearchResultListSchema,
    AvailableRideListSchema,
    CreateRideResponseSchema,
    CancelRideResponseSchema,
    CompleteRideResponseSchema,
    EndRideResponseSchema,
    EstimateEtaBodySchema,
    EstimateEtaResponseSchema,
} from "@repo/shared";

export const RideRoutes = new Elysia({ prefix: "/rides", tags: ["Rides"] })
    .model({
        Ride: RideSchema,
        CreateRideBody: CreateRideBodySchema,
        SearchRidesQuery: SearchRidesQuerySchema,
        CancelRideBody: CancelRideBodySchema,
        EndRideBody: EndRideBodySchema,
        RideIdParams: RideIdParamsSchema,
        TimeframeQuery: TimeframeQuerySchema,
        ErrorResponse: ErrorResponseSchema,
        RideListItemList: RideListItemListSchema,
        RidePassengersView: RidePassengersViewSchema,
        RideSearchResultList: RideSearchResultListSchema,
        AvailableRideList: AvailableRideListSchema,
        CreateRideResponse: CreateRideResponseSchema,
        CancelRideResponse: CancelRideResponseSchema,
        CompleteRideBody: CompleteRideBodySchema,
        CompleteRideResponse: CompleteRideResponseSchema,
        EndRideResponse: EndRideResponseSchema,
        EstimateEtaBody: EstimateEtaBodySchema,
        EstimateEtaResponse: EstimateEtaResponseSchema,
    })
    .onError(createErrorHandler(RideError, rideErrorToHttpStatus))
    .get(
        "/available",
        async ({ request }) => {
            return await RideService.getAvailableRides(
                await resolveViewerId(request)
            );
        },
        {
            response: {
                200: "AvailableRideList",
                429: "ErrorResponse",
                500: "ErrorResponse",
            },
            detail: {
                description:
                    "Returns upcoming planned rides available for booking",
            },
        }
    )
    .get(
        "/search",
        async ({ query, request }) => {
            return await RideService.searchRides(
                query,
                await resolveViewerId(request)
            );
        },
        {
            query: SearchRidesQuerySchema,
            response: {
                200: "RideSearchResultList",
                400: "ErrorResponse",
                429: "ErrorResponse",
                500: "ErrorResponse",
            },
            detail: {
                description:
                    "Search rides between two cities on a specific date",
            },
        }
    )
    .use(isFullyOnboarded)
    .guard({ auth: true, onboarded: true }, (app) =>
        app
            .get(
                "/me",
                async ({ user, query }) => {
                    return await RideService.getDriverRides(
                        user.id,
                        query.timeframe as "UPCOMING" | "PAST" | "ALL"
                    );
                },
                {
                    query: TimeframeQuerySchema,
                    response: {
                        200: "RideListItemList",
                        401: "ErrorResponse",
                        429: "ErrorResponse",
                        500: "ErrorResponse",
                    },
                    detail: {
                        description:
                            "Returns rides created by the authenticated driver",
                    },
                }
            )

            .post(
                "/",
                async ({ user, body, status }) => {
                    const rideId = await RideService.createRide(user.id, body);
                    return status(201, { id: rideId });
                },
                {
                    body: "CreateRideBody",
                    response: {
                        201: "CreateRideResponse",
                        400: "ErrorResponse",
                        403: "ErrorResponse",
                        413: "ErrorResponse",
                        429: "ErrorResponse",
                        500: "ErrorResponse",
                    },
                    detail: {
                        description: "Creates a new ride as a driver",
                    },
                }
            )

            .post(
                "/estimate-eta",
                async ({ body }) => {
                    return await RideService.estimateEtasForStops(
                        body.departureAt,
                        body.stops
                    );
                },
                {
                    body: "EstimateEtaBody",
                    response: {
                        200: "EstimateEtaResponse",
                        400: "ErrorResponse",
                        429: "ErrorResponse",
                        500: "ErrorResponse",
                    },
                    detail: {
                        description:
                            "Calculates estimated arrival times for a given route using OSRM",
                    },
                }
            )

            .get(
                "/:id/passengers",
                async ({ user, params }) =>
                    await RideService.getRidePassengers(params.id, user.id),
                {
                    params: RideIdParamsSchema,
                    response: {
                        200: "RidePassengersView",
                        404: "ErrorResponse",
                        429: "ErrorResponse",
                        500: "ErrorResponse",
                    },
                    detail: {
                        description:
                            "Returns ride details including all confirmed passengers",
                    },
                }
            )

            .patch(
                "/:id/cancel",
                async ({ user, params, body }) => {
                    const cancelledId = await RideService.cancelRide(
                        params.id,
                        user.id,
                        body.reason
                    );
                    return { id: cancelledId, status: "CANCELLED" as const };
                },
                {
                    params: RideIdParamsSchema,
                    body: "CancelRideBody",
                    response: {
                        200: "CancelRideResponse",
                        400: "ErrorResponse",
                        404: "ErrorResponse",
                        413: "ErrorResponse",
                        429: "ErrorResponse",
                        500: "ErrorResponse",
                    },
                    detail: {
                        description:
                            "Cancels a ride and cascades cancellation to all active passenger bookings",
                    },
                }
            )

            .patch(
                "/:id/end",
                async ({ user, params, body }) => {
                    const endedId = await RideService.endRide({
                        rideId: params.id,
                        actorUserId: user.id,
                        source: "DRIVER",
                        reason: body.reason,
                    });
                    return { id: endedId, status: "COMPLETED" as const };
                },
                {
                    params: RideIdParamsSchema,
                    body: "EndRideBody",
                    response: {
                        200: "EndRideResponse",
                        400: "ErrorResponse",
                        404: "ErrorResponse",
                        413: "ErrorResponse",
                        429: "ErrorResponse",
                        500: "ErrorResponse",
                    },
                    detail: {
                        description:
                            "Ends the driver's ride idempotently and records ride end metadata",
                    },
                }
            )

            .patch(
                "/:id/complete",
                async ({ user, params, body }) => {
                    const completedId = await RideService.completeRide(
                        params.id,
                        user.id,
                        body.reason
                    );
                    return { id: completedId, status: "COMPLETED" as const };
                },
                {
                    params: RideIdParamsSchema,
                    body: "CompleteRideBody",
                    response: {
                        200: "CompleteRideResponse",
                        400: "ErrorResponse",
                        404: "ErrorResponse",
                        413: "ErrorResponse",
                        429: "ErrorResponse",
                        500: "ErrorResponse",
                    },
                    detail: {
                        description:
                            "Marks the driver's ride as COMPLETED and carries confirmed bookings to COMPLETED, opening the review window",
                    },
                }
            )
    );
