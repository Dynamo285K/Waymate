import { Elysia } from "elysia";
import { BookingService } from "./booking.service";
import { isFullyOnboarded } from "../auth/auth.middleware";
import { BookingErrors } from "./booking.errors";
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
    // Global error handler (consistent with cars and rides).
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
            // PASSENGER ROUTES
            // ==========================================

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
                    query: "BookingTimeframeQuery",
                    response: {
                        200: "PassengerBookingList",
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
                    try {
                        const bookingId =
                            await BookingService.createBookingRequest({
                                rideId: body.rideId,
                                pickupStopId: body.pickupStopId,
                                dropoffStopId: body.dropoffStopId,
                                seatCount: body.seatCount,
                                passengerId: user.id,
                            });
                        return status(201, {
                            id: bookingId,
                            status: "PENDING",
                        });
                    } catch (error) {
                        const message =
                            error instanceof Error
                                ? error.message
                                : String(error);

                        // Error Translation
                        if (
                            message === BookingErrors.RideNotFoundOrUnavailable
                        ) {
                            return status(404, {
                                error: "Ride not found or no longer available",
                            });
                        }
                        if (message === BookingErrors.InvalidStops) {
                            return status(400, {
                                error: "Invalid pickup or dropoff stops",
                            });
                        }
                        if (message === BookingErrors.PriceNotFound) {
                            return status(400, {
                                error: "Price for this route is not set",
                            });
                        }
                        if (message === BookingErrors.SelfBookingNotAllowed) {
                            return status(400, {
                                error: "You cannot book your own ride",
                            });
                        }
                        if (message === BookingErrors.NotEnoughSeats) {
                            return status(409, {
                                error: "Not enough seats available",
                            });
                        }
                        if (message === BookingErrors.AlreadyBooked) {
                            return status(409, {
                                error: "You have already requested to join this ride",
                            });
                        }

                        return status(500, {
                            error: "Failed to create booking request",
                        });
                    }
                },
                {
                    body: "CreateBookingBody",
                    response: {
                        201: "BookingActionResponse",
                        400: "ErrorResponse",
                        404: "ErrorResponse",
                        409: "ErrorResponse",
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
                async ({ user, params, body, status }) => {
                    try {
                        const cancelledId =
                            await BookingService.cancelBookingByPassenger(
                                params.id,
                                user.id,
                                body.reason
                            );
                        return status(200, {
                            id: cancelledId,
                            status: "CANCELLED",
                        });
                    } catch (error) {
                        const message =
                            error instanceof Error
                                ? error.message
                                : String(error);

                        if (message === BookingErrors.BookingNotFound) {
                            return status(404, { error: "Booking not found" });
                        }
                        if (message === BookingErrors.UnauthorizedAction) {
                            return status(403, {
                                error: "You can only cancel your own bookings",
                            });
                        }
                        if (message === BookingErrors.AlreadyCancelled) {
                            return status(400, {
                                error: "Booking is already cancelled",
                            });
                        }
                        if (message === BookingErrors.InvalidStatusTransition) {
                            return status(400, {
                                error: "Only pending or confirmed bookings can be cancelled",
                            });
                        }

                        return status(500, {
                            error: "Failed to cancel booking",
                        });
                    }
                },
                {
                    params: "BookingIdParams",
                    body: "CancelBookingBody",
                    response: {
                        200: "BookingActionResponse",
                        400: "ErrorResponse",
                        403: "ErrorResponse",
                        404: "ErrorResponse",
                        500: "ErrorResponse",
                    },
                    detail: {
                        description: "Passenger cancels their own booking",
                    },
                }
            )

            // ==========================================
            // DRIVER ROUTES
            // ==========================================

            .patch(
                "/:id/confirm",
                async ({ user, params, status }) => {
                    try {
                        const confirmedId = await BookingService.confirmBooking(
                            params.id,
                            user.id
                        );
                        return status(200, {
                            id: confirmedId,
                            status: "CONFIRMED",
                        });
                    } catch (error) {
                        const message =
                            error instanceof Error
                                ? error.message
                                : String(error);

                        if (message === BookingErrors.UnauthorizedAction) {
                            return status(403, {
                                error: "Not authorized to manage this ride",
                            });
                        }
                        if (message === BookingErrors.InvalidStatusTransition) {
                            return status(400, {
                                error: "Booking not found or not in PENDING state",
                            });
                        }
                        if (
                            message === BookingErrors.RideNotFoundOrUnavailable
                        ) {
                            return status(404, {
                                error: "Ride not found or no longer available",
                            });
                        }
                        if (message === BookingErrors.NotEnoughSeats) {
                            return status(409, {
                                error: "Not enough seats available to confirm this booking",
                            });
                        }

                        return status(500, {
                            error: "Failed to confirm booking",
                        });
                    }
                },
                {
                    params: "BookingIdParams",
                    response: {
                        200: "BookingActionResponse",
                        400: "ErrorResponse",
                        403: "ErrorResponse",
                        404: "ErrorResponse",
                        409: "ErrorResponse",
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
                async ({ user, params, body, status }) => {
                    try {
                        const rejectedId = await BookingService.rejectBooking(
                            params.id,
                            user.id,
                            body.reason
                        );
                        return status(200, {
                            id: rejectedId,
                            status: "REJECTED",
                        });
                    } catch (error) {
                        const message =
                            error instanceof Error
                                ? error.message
                                : String(error);

                        if (message === BookingErrors.UnauthorizedAction) {
                            return status(403, {
                                error: "Not authorized to manage this ride",
                            });
                        }
                        if (message === BookingErrors.InvalidStatusTransition) {
                            return status(400, {
                                error: "Booking not found or not in PENDING state",
                            });
                        }
                        if (
                            message === BookingErrors.RideNotFoundOrUnavailable
                        ) {
                            return status(404, {
                                error: "Ride not found or no longer available",
                            });
                        }

                        return status(500, {
                            error: "Failed to reject booking",
                        });
                    }
                },
                {
                    params: "BookingIdParams",
                    body: "RejectBookingBody",
                    response: {
                        200: "BookingActionResponse",
                        400: "ErrorResponse",
                        403: "ErrorResponse",
                        404: "ErrorResponse",
                        500: "ErrorResponse",
                    },
                    detail: {
                        description:
                            "Driver rejects a passenger's pending booking request",
                    },
                }
            )
    );
