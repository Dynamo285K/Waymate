import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import type { reviews } from "../../db/schema/review";
import type { User } from "../users/user.types";
import type { RideId } from "@repo/shared";

export type Review = InferSelectModel<typeof reviews>;

export type ReviewInsert = InferInsertModel<typeof reviews>;

export type ReviewStatus = Review["reviewStatus"];

// Data passed from the service layer to the repository when creating a review.
export type CreateReviewInput = {
    rideId: RideId;
    authorId: string;
    subjectId: string;
    rating: number;
    comment?: string | null;
};

type PublicUserProfile = Pick<
    User,
    "id" | "firstName" | "lastName" | "profilePhotoUrl"
>;

// A single review as displayed on a target user's profile.
export type ReviewListItem = {
    id: string;
    rideId: string;
    rating: number;
    comment: string | null;
    reviewStatus: ReviewStatus;
    createdAt: Date;
    author: PublicUserProfile;
    ride: { originCity: string; destinationCity: string };
};

// Aggregated reviews view for a user (subject).
export type UserReviewsView = {
    subjectId: string;
    averageRating: number | null;
    reviewCount: number;
    reviews: ReviewListItem[];
};

// A review authored by the current user, listed in their "My reviews" view.
export type AuthoredReviewListItem = {
    id: string;
    rideId: string;
    rating: number;
    comment: string | null;
    reviewStatus: ReviewStatus;
    createdAt: Date;
    subject: PublicUserProfile;
    ride: { originCity: string; destinationCity: string };
};
