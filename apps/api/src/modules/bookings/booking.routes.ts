import { Elysia } from "elysia";
import { BookingService } from "./booking.service";
import { isFullyOnboarded } from "../auth/auth.middleware";
import { createErrorHandler } from "../auth/auth.errors";
import { BookingError, bookingErrorToHttpStatus } from "./booking.errors";
import {
    ErrorResponseSchema,
    BookingIdParamsSchema,
    CreateBookingBodySchema,
    CancelBookingBodySchema,
    RejectBookingBodySchema,
    BookingTimeframeQuerySchema,
    BookingActionResponseSchema,
    PassengerBookingListItemSchema,
    PassengerBookingListSchema,
    DriverRideRequestListSchema,
} from "@repo/shared";

export const BookingRoutes = new Elysia({
    prefix: "/bookings",
    tags: ["Bookings"],
})
    .model({
        BookingIdParams: BookingIdParamsSchema,
        CreateBookingBody: CreateBookingBodySchema,
        CancelBookingBody: CancelBookingBodySchema,
        RejectBookingBody: RejectBookingBodySchema,
        BookingTimeframeQuery: BookingTimeframeQuerySchema,
        BookingActionResponse: BookingActionResponseSchema,
        PassengerBookingListItem: PassengerBookingListItemSchema,
        PassengerBookingList: PassengerBookingListSchema,
        DriverRideRequestList: DriverRideRequestListSchema,
        ErrorResponse: ErrorResponseSchema,
    })
    .use(isFullyOnboarded)
    .guard({ auth: true, onboarded: true }, (app) =>
        app
            .onError(createErrorHandler(BookingError, bookingErrorToHttpStatus))
            // PASSENGER ROUTES

            .get(
                "/requests",
                async ({ user }) => {
                    return await BookingService.getPendingRequestsForDriver(
                        user.id
                    );
                },
                {
                    response: {
                        200: "DriverRideRequestList",
                        429: "ErrorResponse",
                        500: "ErrorResponse",
                    },
                    detail: {
                        description:
                            "Returns all pending booking requests for rides offered by the authenticated driver",
                    },
                }
            )
            .get(
                "/me",
                async ({ user, query }) => {
                    return await BookingService.getPassengerBookings(
                        user.id,
                        query.timeframe
                    );
                },
                {
                    query: BookingTimeframeQuerySchema,
                    response: {
                        200: "PassengerBookingList",
                        429: "ErrorResponse",
                    },
                    detail: {
                        description:
                            "Returns bookings created by the authenticated passenger filtered by timeframe",
                    },
                }
            )

            .post(
                "/",
                async ({ user, body, status }) => {
                    const bookingId = await BookingService.createBookingRequest(
                        {
                            rideId: body.rideId,
                            pickupStopId: body.pickupStopId,
                            dropoffStopId: body.dropoffStopId,
                            seatCount: body.seatCount,
                            passengerId: user.id,
                            dynamicPickup: body.dynamicPickup,
                            dynamicDropoff: body.dynamicDropoff,
                            priceAmount: body.priceAmount,
                            requestedPickupCity: body.requestedPickupCity,
                            requestedDropoffCity: body.requestedDropoffCity,
                        }
                    );
                    return status(201, {
                        id: bookingId,
                        status: "PENDING",
                    });
                },
                {
                    body: "CreateBookingBody",
                    response: {
                        201: "BookingActionResponse",
                        400: "ErrorResponse",
                        404: "ErrorResponse",
                        409: "ErrorResponse",
                        413: "ErrorResponse",
                        429: "ErrorResponse",
                        500: "ErrorResponse",
                    },
                    detail: {
                        description:
                            "Passenger creates a pending request to join a ride. Price is calculated automatically.",
                    },
                }
            )

            .patch(
                "/:id/cancel",
                async ({ user, params, body }) => {
                    const cancelledId =
                        await BookingService.cancelBookingByPassenger(
                            params.id,
                            user.id,
                            body.reason
                        );
                    return {
                        id: cancelledId,
                        status: "CANCELLED" as const,
                    };
                },
                {
                    params: BookingIdParamsSchema,
                    body: "CancelBookingBody",
                    response: {
                        200: "BookingActionResponse",
                        400: "ErrorResponse",
                        403: "ErrorResponse",
                        404: "ErrorResponse",
                        413: "ErrorResponse",
                        429: "ErrorResponse",
                        500: "ErrorResponse",
                    },
                    detail: {
                        description: "Passenger cancels their own booking",
                    },
                }
            )

            // DRIVER ROUTES

            .patch(
                "/:id/driver/cancel",
                async ({ user, params, body }) => {
                    const cancelledId =
                        await BookingService.cancelBookingByDriver(
                            params.id,
                            user.id,
                            body.reason
                        );
                    return {
                        id: cancelledId,
                        status: "CANCELLED" as const,
                    };
                },
                {
                    params: BookingIdParamsSchema,
                    body: "CancelBookingBody",
                    response: {
                        200: "BookingActionResponse",
                        400: "ErrorResponse",
                        403: "ErrorResponse",
                        404: "ErrorResponse",
                        413: "ErrorResponse",
                        429: "ErrorResponse",
                        500: "ErrorResponse",
                    },
                    detail: {
                        description:
                            "Driver cancels a pending or confirmed passenger booking for their own ride",
                    },
                }
            )

            .patch(
                "/:id/confirm",
                async ({ user, params }) => {
                    const confirmedId = await BookingService.confirmBooking(
                        params.id,
                        user.id
                    );
                    return {
                        id: confirmedId,
                        status: "CONFIRMED" as const,
                    };
                },
                {
                    params: BookingIdParamsSchema,
                    response: {
                        200: "BookingActionResponse",
                        400: "ErrorResponse",
                        403: "ErrorResponse",
                        404: "ErrorResponse",
                        409: "ErrorResponse",
                        429: "ErrorResponse",
                        500: "ErrorResponse",
                    },
                    detail: {
                        description:
                            "Driver confirms a passenger's pending booking request",
                    },
                }
            )

            .patch(
                "/:id/reject",
                async ({ user, params, body }) => {
                    const rejectedId = await BookingService.rejectBooking(
                        params.id,
                        user.id,
                        body.reason
                    );
                    return {
                        id: rejectedId,
                        status: "REJECTED" as const,
                    };
                },
                {
                    params: BookingIdParamsSchema,
                    body: "RejectBookingBody",
                    response: {
                        200: "BookingActionResponse",
                        400: "ErrorResponse",
                        403: "ErrorResponse",
                        404: "ErrorResponse",
                        413: "ErrorResponse",
                        429: "ErrorResponse",
                        500: "ErrorResponse",
                    },
                    detail: {
                        description:
                            "Driver rejects a passenger's pending booking request",
                    },
                }
            )
    );
