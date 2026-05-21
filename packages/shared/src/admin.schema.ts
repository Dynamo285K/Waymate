import { z } from "zod";
import {
    PublicUserPreviewSchema,
    UserEntitySchema,
    UserIdSchema,
    UserStatusSchema,
} from "./user.schema";
import {
    RideIdSchema,
    RideStatusSchema,
    RideStopIdSchema,
} from "./ride.schema";
import { ReviewIdSchema, ReviewStatusSchema } from "./review.schema";
import {
    ReportIdSchema,
    ReportStatusSchema,
    ReportTypeSchema,
} from "./report.schema";
import { CountryCodeSchema } from "./country-code.schema";
import { CurrencySchema } from "./currency.schema";
import { bookingStatusValues } from "./status-values";

export const AdminUserIdParamsSchema = z.object({
    id: UserIdSchema,
});

export const AdminUserListQuerySchema = z.object({
    limit: z.coerce.number().int().min(1).max(100).default(20),
    cursor: UserIdSchema.optional(),
    search: z.string().trim().min(1).max(100).optional(),
});

export const AdminUserListItemSchema = UserEntitySchema.pick({
    id: true,
    email: true,
    firstName: true,
    lastName: true,
    userRole: true,
    userStatus: true,
    createdAt: true,
    lastActiveAt: true,
});

export const AdminUserListResponseSchema = z.object({
    items: z.array(AdminUserListItemSchema),
    nextCursor: UserIdSchema.nullable(),
});

export const AdminUserDetailSchema = UserEntitySchema.pick({
    id: true,
    email: true,
    firstName: true,
    lastName: true,
    displayName: true,
    phone: true,
    bio: true,
    profilePhotoUrl: true,
    userRole: true,
    userStatus: true,
    emailVerifiedAt: true,
    phoneVerifiedAt: true,
    lastActiveAt: true,
    createdAt: true,
    updatedAt: true,
});

export const AdminUserStatusHistoryItemSchema = z.object({
    id: z.uuid(),
    oldStatus: UserStatusSchema.nullable(),
    newStatus: UserStatusSchema,
    reason: z.string().nullable(),
    createdAt: z.date(),
    changedBy: z
        .object({
            id: UserIdSchema,
            firstName: z.string().nullable(),
            lastName: z.string().nullable(),
        })
        .nullable(),
});

export const AdminUserDetailResponseSchema = z.object({
    user: AdminUserDetailSchema,
    statusHistory: z.array(AdminUserStatusHistoryItemSchema),
});

// Admin tooling may only move an account between these moderation states.
// PENDING is owned by the sign-up flow, and DELETED must go through soft-delete
// (which also sets deletedAt) — allowing them here would create an account that
// reads as "deleted"/"pending" while staying fully visible and usable.
export const AdminSettableUserStatusSchema = z.enum([
    "ACTIVE",
    "SUSPENDED",
    "BANNED",
]);

export const UpdateUserStatusBodySchema = z
    .object({
        status: AdminSettableUserStatusSchema,
        reason: z.string().trim().min(1).max(500).optional(),
    })
    .strict();

export type AdminUserListQuery = z.infer<typeof AdminUserListQuerySchema>;
export type AdminUserListItem = z.infer<typeof AdminUserListItemSchema>;
export type AdminUserListResponse = z.infer<typeof AdminUserListResponseSchema>;
export type AdminUserDetail = z.infer<typeof AdminUserDetailSchema>;
export type AdminUserStatusHistoryItem = z.infer<
    typeof AdminUserStatusHistoryItemSchema
>;
export type AdminUserDetailResponse = z.infer<
    typeof AdminUserDetailResponseSchema
>;
export type UpdateUserStatusBody = z.infer<typeof UpdateUserStatusBodySchema>;

// ==========================================
// Ride moderation
// ==========================================

export const AdminRideIdParamsSchema = z.object({
    id: RideIdSchema,
});

export const AdminRideListQuerySchema = z.object({
    limit: z.coerce.number().int().min(1).max(100).default(20),
    cursor: RideIdSchema.optional(),
    status: RideStatusSchema.optional(),
    search: z.string().trim().min(1).max(100).optional(),
});

export const AdminRideListItemSchema = z.object({
    id: RideIdSchema,
    rideStatus: RideStatusSchema,
    departureAt: z.date(),
    offeredSeats: z.number().int(),
    currency: CurrencySchema,
    originCity: z.string(),
    destinationCity: z.string(),
    activeSeatCount: z.number().int(),
    driver: PublicUserPreviewSchema.extend({
        email: z.string(),
    }),
    createdAt: z.date(),
});

export const AdminRideListResponseSchema = z.object({
    items: z.array(AdminRideListItemSchema),
    nextCursor: RideIdSchema.nullable(),
});

export const AdminRideDetailSchema = z.object({
    id: RideIdSchema,
    rideStatus: RideStatusSchema,
    departureAt: z.date(),
    arrivalEstimateAt: z.date().nullable(),
    offeredSeats: z.number().int(),
    currency: CurrencySchema,
    description: z.string().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
    driver: PublicUserPreviewSchema.extend({
        email: z.string(),
        userStatus: UserStatusSchema,
    }),
    car: z.object({
        id: z.uuid(),
        spz: z.string(),
        brand: z.string().nullable(),
        modelName: z.string().nullable(),
    }),
    stops: z.array(
        z.object({
            id: RideStopIdSchema,
            stopOrder: z.number().int(),
            address: z.string(),
            city: z.string(),
            countryCode: CountryCodeSchema.nullable(),
            plannedArrivalAt: z.date().nullable(),
            plannedDepartureAt: z.date().nullable(),
        })
    ),
    prices: z.array(
        z.object({
            startStopId: RideStopIdSchema,
            endStopId: RideStopIdSchema,
            amount: z.number().int(),
            currency: CurrencySchema,
        })
    ),
    bookings: z.array(
        z.object({
            id: z.uuid(),
            bookingStatus: z.enum(bookingStatusValues),
            seatCount: z.number().int(),
            passenger: PublicUserPreviewSchema,
        })
    ),
});

export const AdminRideStatusHistoryItemSchema = z.object({
    id: z.uuid(),
    oldStatus: RideStatusSchema.nullable(),
    newStatus: RideStatusSchema,
    reason: z.string().nullable(),
    createdAt: z.date(),
    changedBy: z
        .object({
            id: UserIdSchema,
            firstName: z.string().nullable(),
            lastName: z.string().nullable(),
        })
        .nullable(),
});

export const AdminRideDetailResponseSchema = z.object({
    ride: AdminRideDetailSchema,
    statusHistory: z.array(AdminRideStatusHistoryItemSchema),
});

export const AdminCancelRideBodySchema = z
    .object({
        reason: z.string().trim().min(1).max(500),
    })
    .strict();

export const AdminCancelRideResponseSchema = z.object({
    id: RideIdSchema,
    status: z.literal("CANCELLED"),
});

export type AdminRideListQuery = z.infer<typeof AdminRideListQuerySchema>;
export type AdminRideListItem = z.infer<typeof AdminRideListItemSchema>;
export type AdminRideListResponse = z.infer<typeof AdminRideListResponseSchema>;
export type AdminRideDetail = z.infer<typeof AdminRideDetailSchema>;
export type AdminRideStatusHistoryItem = z.infer<
    typeof AdminRideStatusHistoryItemSchema
>;
export type AdminRideDetailResponse = z.infer<
    typeof AdminRideDetailResponseSchema
>;
export type AdminCancelRideBody = z.infer<typeof AdminCancelRideBodySchema>;

// ==========================================
// Review moderation
// ==========================================

export const AdminReviewIdParamsSchema = z.object({
    id: ReviewIdSchema,
});

export const AdminReviewListQuerySchema = z.object({
    limit: z.coerce.number().int().min(1).max(100).default(20),
    cursor: ReviewIdSchema.optional(),
    status: ReviewStatusSchema.optional(),
    minRating: z.coerce.number().int().min(1).max(5).optional(),
    maxRating: z.coerce.number().int().min(1).max(5).optional(),
    subjectRole: z.enum(["DRIVER", "PASSENGER"]).optional(),
    search: z.string().trim().min(1).max(100).optional(),
});

export const AdminReviewListItemSchema = z.object({
    id: ReviewIdSchema,
    rideId: RideIdSchema,
    rating: z.number().int().min(1).max(5),
    comment: z.string().nullable(),
    reviewStatus: ReviewStatusSchema,
    authorRole: z.enum(["DRIVER", "PASSENGER"]),
    subjectRole: z.enum(["DRIVER", "PASSENGER"]),
    author: PublicUserPreviewSchema.extend({
        email: z.string(),
    }),
    subject: PublicUserPreviewSchema.extend({
        email: z.string(),
    }),
    ride: z.object({
        originCity: z.string(),
        destinationCity: z.string(),
    }),
    createdAt: z.date(),
});

export const AdminReviewListResponseSchema = z.object({
    items: z.array(AdminReviewListItemSchema),
    nextCursor: ReviewIdSchema.nullable(),
});

export const AdminReviewCountsSchema = z.object({
    all: z.number().int().nonnegative(),
    visible: z.number().int().nonnegative(),
    hidden: z.number().int().nonnegative(),
});

export const AdminDeleteReviewResponseSchema = z.object({
    id: ReviewIdSchema,
});

export const AdminReviewDetailSchema = AdminReviewListItemSchema.extend({
    updatedAt: z.date(),
    ride: z.object({
        id: RideIdSchema,
        departureAt: z.date(),
        originCity: z.string(),
        destinationCity: z.string(),
    }),
});

export const AdminReviewStatusHistoryItemSchema = z.object({
    id: z.uuid(),
    oldStatus: ReviewStatusSchema.nullable(),
    newStatus: ReviewStatusSchema,
    reason: z.string().nullable(),
    createdAt: z.date(),
    changedBy: z
        .object({
            id: UserIdSchema,
            firstName: z.string().nullable(),
            lastName: z.string().nullable(),
        })
        .nullable(),
});

export const AdminReviewDetailResponseSchema = z.object({
    review: AdminReviewDetailSchema,
    statusHistory: z.array(AdminReviewStatusHistoryItemSchema),
});

export const UpdateReviewStatusBodySchema = z
    .object({
        status: ReviewStatusSchema,
        reason: z.string().trim().min(1).max(500),
    })
    .strict();

export type AdminReviewListQuery = z.infer<typeof AdminReviewListQuerySchema>;
export type AdminReviewListItem = z.infer<typeof AdminReviewListItemSchema>;
export type AdminReviewListResponse = z.infer<
    typeof AdminReviewListResponseSchema
>;
export type AdminReviewCounts = z.infer<typeof AdminReviewCountsSchema>;
export type AdminDeleteReviewResponse = z.infer<
    typeof AdminDeleteReviewResponseSchema
>;
export type AdminReviewDetail = z.infer<typeof AdminReviewDetailSchema>;
export type AdminReviewStatusHistoryItem = z.infer<
    typeof AdminReviewStatusHistoryItemSchema
>;
export type AdminReviewDetailResponse = z.infer<
    typeof AdminReviewDetailResponseSchema
>;
export type UpdateReviewStatusBody = z.infer<
    typeof UpdateReviewStatusBodySchema
>;

// ==========================================
// Report moderation
// ==========================================

export const AdminReportIdParamsSchema = z.object({
    id: ReportIdSchema,
});

export const AdminReportListQuerySchema = z.object({
    limit: z.coerce.number().int().min(1).max(100).default(20),
    cursor: ReportIdSchema.optional(),
    status: ReportStatusSchema.optional(),
    reportType: ReportTypeSchema.optional(),
    search: z.string().trim().min(1).max(100).optional(),
});

export const AdminReportListItemSchema = z.object({
    id: ReportIdSchema,
    reportType: ReportTypeSchema,
    reportStatus: ReportStatusSchema,
    description: z.string(),
    rideId: RideIdSchema.nullable(),
    reporter: PublicUserPreviewSchema.extend({
        email: z.string(),
    }),
    target: PublicUserPreviewSchema.extend({
        email: z.string(),
    }),
    createdAt: z.date(),
});

export const AdminReportListResponseSchema = z.object({
    items: z.array(AdminReportListItemSchema),
    nextCursor: ReportIdSchema.nullable(),
});

export const AdminReportDetailSchema = AdminReportListItemSchema.extend({
    updatedAt: z.date(),
    resolutionReason: z.string().nullable(),
    ride: z
        .object({
            id: RideIdSchema,
            departureAt: z.date(),
            originCity: z.string(),
            destinationCity: z.string(),
        })
        .nullable(),
});

export const AdminReportStatusHistoryItemSchema = z.object({
    id: z.uuid(),
    oldStatus: ReportStatusSchema.nullable(),
    newStatus: ReportStatusSchema,
    reason: z.string().nullable(),
    createdAt: z.date(),
    changedBy: z
        .object({
            id: UserIdSchema,
            firstName: z.string().nullable(),
            lastName: z.string().nullable(),
        })
        .nullable(),
});

export const AdminReportDetailResponseSchema = z.object({
    report: AdminReportDetailSchema,
    statusHistory: z.array(AdminReportStatusHistoryItemSchema),
});

export const UpdateReportStatusBodySchema = z
    .object({
        status: ReportStatusSchema,
        reason: z.string().trim().min(1).max(500).optional(),
    })
    .strict();

export type AdminReportListQuery = z.infer<typeof AdminReportListQuerySchema>;
export type AdminReportListItem = z.infer<typeof AdminReportListItemSchema>;
export type AdminReportListResponse = z.infer<
    typeof AdminReportListResponseSchema
>;
export type AdminReportDetail = z.infer<typeof AdminReportDetailSchema>;
export type AdminReportStatusHistoryItem = z.infer<
    typeof AdminReportStatusHistoryItemSchema
>;
export type AdminReportDetailResponse = z.infer<
    typeof AdminReportDetailResponseSchema
>;
export type UpdateReportStatusBody = z.infer<
    typeof UpdateReportStatusBodySchema
>;

// ==========================================
// Dashboard
// ==========================================

export const AdminDashboardDayRidesSchema = z.object({
    date: z.string(),
    count: z.number().int().nonnegative(),
});

export const AdminDashboardDayRevenueSchema = z.object({
    date: z.string(),
    totalCents: z.number().int().nonnegative(),
});

export const AdminDashboardPopularRouteSchema = z.object({
    originCity: z.string(),
    destinationCity: z.string(),
    count: z.number().int().nonnegative(),
});

export const AdminDashboardUserMetricsSchema = z.object({
    totalRegistered: z.number().int().nonnegative(),
    activeInLast24h: z.number().int().nonnegative(),
    drivers: z.number().int().nonnegative(),
    passengers: z.number().int().nonnegative(),
    pendingVerification: z.number().int().nonnegative(),
    bannedAccounts: z.number().int().nonnegative(),
});

export const AdminDashboardResponseSchema = z.object({
    weeklyRides: z.array(AdminDashboardDayRidesSchema),
    weeklyRevenue: z.array(AdminDashboardDayRevenueSchema),
    popularRoutes: z.array(AdminDashboardPopularRouteSchema),
    userMetrics: AdminDashboardUserMetricsSchema,
});

export type AdminDashboardResponse = z.infer<
    typeof AdminDashboardResponseSchema
>;
