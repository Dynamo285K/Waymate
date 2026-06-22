import { Elysia } from "elysia";
import {
    AdminRideIdParamsSchema,
    AdminRideListQuerySchema,
    AdminRideListItemSchema,
    AdminRideListResponseSchema,
    AdminRideDetailSchema,
    AdminRideStatusHistoryItemSchema,
    AdminRideDetailResponseSchema,
    AdminCancelRideBodySchema,
    AdminCancelRideResponseSchema,
    ErrorResponseSchema,
} from "@repo/shared";
import { AdminRideService } from "./admin-ride.service";
import { requireAdmin } from "../../auth/auth.middleware";

export const AdminRideRoutes = new Elysia({ prefix: "/admin" })
    .use(requireAdmin)
    .model({
        AdminRideIdParams: AdminRideIdParamsSchema,
        AdminRideListQuery: AdminRideListQuerySchema,
        AdminRideListItem: AdminRideListItemSchema,
        AdminRideListResponse: AdminRideListResponseSchema,
        AdminRideDetail: AdminRideDetailSchema,
        AdminRideStatusHistoryItem: AdminRideStatusHistoryItemSchema,
        AdminRideDetailResponse: AdminRideDetailResponseSchema,
        AdminCancelRideBody: AdminCancelRideBodySchema,
        AdminCancelRideResponse: AdminCancelRideResponseSchema,
        ErrorResponse: ErrorResponseSchema,
    })
    .guard({ auth: true, admin: true }, (app) =>
        app
            .get(
                "/",
                async ({ query }) => {
                    return await AdminRideService.getRideList({
                        limit: query.limit,
                        cursor: query.cursor,
                        status: query.status,
                        search: query.search,
                    });
                },
                {
                    query: AdminRideListQuerySchema,
                    response: {
                        200: "AdminRideListResponse",
                        400: "ErrorResponse",
                        401: "ErrorResponse",
                        403: "ErrorResponse",
                        429: "ErrorResponse",
                        500: "ErrorResponse",
                    },
                    detail: {
                        description:
                            "Returns a keyset-paginated list of rides for admin tooling. Supports filtering by status and case-insensitive driver email/firstName/lastName search.",
                    },
                }
            )
            .get(
                "/:id",
                async ({ params }) =>
                    await AdminRideService.getRideDetail(params.id),
                {
                    params: AdminRideIdParamsSchema,
                    response: {
                        200: "AdminRideDetailResponse",
                        400: "ErrorResponse",
                        401: "ErrorResponse",
                        403: "ErrorResponse",
                        404: "ErrorResponse",
                        429: "ErrorResponse",
                        500: "ErrorResponse",
                    },
                    detail: {
                        description:
                            "Returns full ride detail (driver, car, stops, prices, bookings) plus the most recent status history entries (newest first, capped at 50). changedBy is null for system-triggered changes.",
                    },
                }
            )
            .patch(
                "/:id/cancel",
                async ({ user, params, body }) =>
                    await AdminRideService.cancelRide({
                        actorId: user.id,
                        rideId: params.id,
                        reason: body.reason,
                    }),
                {
                    params: AdminRideIdParamsSchema,
                    body: "AdminCancelRideBody",
                    response: {
                        200: "AdminCancelRideResponse",
                        400: "ErrorResponse",
                        401: "ErrorResponse",
                        403: "ErrorResponse",
                        404: "ErrorResponse",
                        413: "ErrorResponse",
                        429: "ErrorResponse",
                        500: "ErrorResponse",
                    },
                    detail: {
                        description:
                            "Force-cancels a ride as admin and cascades cancellation to all active passenger bookings (PENDING/CONFIRMED). Records an audit row in ride_status_history with the admin as changedByUserId. The reason is required so the audit log makes the override traceable.",
                    },
                }
            )
    );
