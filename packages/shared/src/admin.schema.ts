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

export const UpdateUserStatusBodySchema = z
    .object({
        status: UserStatusSchema,
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
    search: z.string().trim().min(1).max(100).optional(),
});

export const AdminReviewListItemSchema = z.object({
    id: ReviewIdSchema,
    rideId: RideIdSchema,
    rating: z.number().int().min(1).max(5),
    comment: z.string().nullable(),
    reviewStatus: ReviewStatusSchema,
    author: PublicUserPreviewSchema.extend({
        email: z.string(),
    }),
    subject: PublicUserPreviewSchema.extend({
        email: z.string(),
    }),
    createdAt: z.date(),
});

export const AdminReviewListResponseSchema = z.object({
    items: z.array(AdminReviewListItemSchema),
    nextCursor: ReviewIdSchema.nullable(),
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
