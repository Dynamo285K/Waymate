import { z } from "zod";
import { reviewStatusValues } from "./status-values";
import { UserIdSchema } from "./user.schema";
import { RideIdSchema } from "./ride.schema";

// ==========================================
// 0. PRIMITIVES
// ==========================================
export const ReviewIdSchema = z.uuid();
export type ReviewId = z.infer<typeof ReviewIdSchema>;

export const ReviewStatusSchema = z.enum(reviewStatusValues);

const RatingSchema = z
    .number()
    .int()
    .min(1, "Rating must be at least 1")
    .max(5, "Rating must be at most 5");

const CommentSchema = z.string().trim().max(1000).nullable();

// ==========================================
// 1. URL PARAMETERS
// ==========================================
export const ReviewIdParamsSchema = z.object({
    id: z.uuid("Invalid review ID"),
});

export const SubjectUserIdParamsSchema = z.object({
    userId: UserIdSchema,
});

// ==========================================
// 2. REQUEST BODIES (Inputs from frontend)
// ==========================================
export const CreateReviewBodySchema = z
    .object({
        rideId: RideIdSchema,
        subjectId: UserIdSchema,
        rating: RatingSchema,
        comment: z.string().trim().max(1000).optional(),
    })
    .strict();

// ==========================================
// 3. RESPONSE SCHEMAS (Outputs for Swagger)
// ==========================================
export const ReviewSchema = z.object({
    id: ReviewIdSchema,
    rideId: RideIdSchema,
    authorId: UserIdSchema,
    subjectId: UserIdSchema,
    rating: RatingSchema,
    comment: CommentSchema,
    reviewStatus: ReviewStatusSchema,
    createdAt: z.date(),
    updatedAt: z.date(),
});

export const ReviewActionResponseSchema = z.object({
    id: ReviewIdSchema,
    reviewStatus: ReviewStatusSchema,
});

export const ReviewListItemSchema = z.object({
    id: ReviewIdSchema,
    rideId: RideIdSchema,
    rating: RatingSchema,
    comment: CommentSchema,
    reviewStatus: ReviewStatusSchema,
    createdAt: z.date(),
    author: z.object({
        id: UserIdSchema,
        firstName: z.string().nullable(),
        lastName: z.string().nullable(),
        profilePhotoUrl: z.string().nullable(),
    }),
});

export const ReviewListItemListSchema = z.array(ReviewListItemSchema);

export const UserReviewsViewSchema = z.object({
    subjectId: UserIdSchema,
    averageRating: z.number().nullable(),
    reviewCount: z.number().int(),
    reviews: ReviewListItemListSchema,
});

export const AuthoredReviewListItemSchema = z.object({
    id: ReviewIdSchema,
    rideId: RideIdSchema,
    rating: RatingSchema,
    comment: CommentSchema,
    reviewStatus: ReviewStatusSchema,
    createdAt: z.date(),
    subject: z.object({
        id: UserIdSchema,
        firstName: z.string().nullable(),
        lastName: z.string().nullable(),
        profilePhotoUrl: z.string().nullable(),
    }),
});

export const AuthoredReviewListSchema = z.array(AuthoredReviewListItemSchema);

// ==========================================
// 4. INFERRED TYPES
// ==========================================
export type CreateReviewBody = z.infer<typeof CreateReviewBodySchema>;
export type ReviewIdParams = z.infer<typeof ReviewIdParamsSchema>;
export type SubjectUserIdParams = z.infer<typeof SubjectUserIdParamsSchema>;
