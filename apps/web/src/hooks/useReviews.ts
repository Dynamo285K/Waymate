import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/eden";
import { unwrap } from "../lib/eden-query";

export type UserReviewsView = {
    subjectId: string;
    averageRating: number | null;
    reviewCount: number;
    reviews: Array<{
        id: string;
        rideId: string;
        rating: number;
        comment: string | null;
        reviewStatus: string;
        createdAt: string | Date;
        author: {
            id: string;
            firstName: string | null;
            lastName: string | null;
            profilePhotoUrl: string | null;
        };
    }>;
};

export type AuthoredReview = {
    id: string;
    rideId: string;
    rating: number;
    comment: string | null;
    reviewStatus: string;
    createdAt: string | Date;
    subject: {
        id: string;
        firstName: string | null;
        lastName: string | null;
        profilePhotoUrl: string | null;
    };
};

export function useUserReviews(userId: string | undefined) {
    return useQuery<UserReviewsView>({
        queryKey: ["reviews", "users", userId],
        queryFn: () =>
            unwrap(
                api.reviews.users({ userId: userId! }).get()
            ) as Promise<UserReviewsView>,
        enabled: Boolean(userId),
    });
}

export function useMyAuthoredReviews() {
    return useQuery<AuthoredReview[]>({
        queryKey: ["reviews", "me", "authored"],
        queryFn: () =>
            unwrap(api.reviews.me.authored.get()) as Promise<AuthoredReview[]>,
    });
}
