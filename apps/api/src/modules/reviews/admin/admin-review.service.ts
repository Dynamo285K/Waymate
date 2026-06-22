import type {
    AdminDeleteReviewResponse,
    AdminReviewCounts,
    AdminReviewDetailResponse,
    AdminReviewListItem,
    AdminReviewListResponse,
} from "@repo/shared";
import { db } from "../../../db";
import { ReviewError, ReviewErrorCodes } from "../review.errors";
import { AdminReviewRepository } from "./admin-review.repository";
import type {
    AdminReviewListFilters,
    SetReviewStatusInput,
} from "./admin-review.types";

const STATUS_HISTORY_DEFAULT_LIMIT = 50;

const getReviewList = async (
    filters: AdminReviewListFilters
): Promise<AdminReviewListResponse> => {
    let cursorPosition: { id: string; createdAt: Date } | undefined;

    if (filters.cursor) {
        const createdAt = await AdminReviewRepository.findReviewCreatedAt(
            db,
            filters.cursor
        );
        if (!createdAt) return { items: [], nextCursor: null };
        cursorPosition = { id: filters.cursor, createdAt };
    }

    const rows = await AdminReviewRepository.findReviewList(db, {
        limit: filters.limit + 1,
        status: filters.status,
        minRating: filters.minRating,
        maxRating: filters.maxRating,
        subjectRole: filters.subjectRole,
        search: filters.search,
        cursorPosition,
    });

    const hasMore = rows.length > filters.limit;
    const items = hasMore ? rows.slice(0, filters.limit) : rows;
    const nextCursor = hasMore ? (items[items.length - 1]?.id ?? null) : null;

    return { items, nextCursor };
};

const getReviewCounts = async (): Promise<AdminReviewCounts> => {
    return await AdminReviewRepository.findReviewCounts(db);
};

const getReviewDetail = async (
    reviewId: string
): Promise<AdminReviewDetailResponse> => {
    const [review, statusHistory] = await Promise.all([
        AdminReviewRepository.findReviewDetailById(db, reviewId),
        AdminReviewRepository.findReviewStatusHistoryByReviewId(
            db,
            reviewId,
            STATUS_HISTORY_DEFAULT_LIMIT
        ),
    ]);

    if (!review) {
        throw new ReviewError(ReviewErrorCodes.ReviewNotFound);
    }

    return { review, statusHistory };
};

const setReviewStatus = async ({
    actorId,
    reviewId,
    newStatus,
    reason,
}: SetReviewStatusInput): Promise<AdminReviewListItem> => {
    return await db.transaction(async (tx) => {
        const review = await AdminReviewRepository.findReviewForAdminUpdate(
            tx,
            reviewId
        );

        if (!review) {
            throw new ReviewError(ReviewErrorCodes.ReviewNotFound);
        }

        if (review.reviewStatus !== newStatus) {
            const updated = await AdminReviewRepository.updateReviewStatusById(
                tx,
                reviewId,
                newStatus
            );

            if (!updated) {
                throw new ReviewError(ReviewErrorCodes.ReviewNotFound);
            }

            await AdminReviewRepository.insertReviewStatusHistoryRow(tx, {
                reviewId: updated.id,
                oldStatus: review.reviewStatus,
                newStatus,
                changedByUserId: actorId,
                reason,
            });
        }

        const detail = await AdminReviewRepository.findReviewDetailById(
            tx,
            reviewId
        );
        if (!detail) {
            throw new ReviewError(ReviewErrorCodes.ReviewNotFound);
        }
        return {
            id: detail.id,
            rideId: detail.rideId,
            rating: detail.rating,
            comment: detail.comment,
            reviewStatus: detail.reviewStatus,
            authorRole: detail.authorRole,
            subjectRole: detail.subjectRole,
            author: detail.author,
            subject: detail.subject,
            ride: {
                originCity: detail.ride.originCity,
                destinationCity: detail.ride.destinationCity,
            },
            createdAt: detail.createdAt,
        };
    });
};

const deleteReview = async (
    reviewId: string
): Promise<AdminDeleteReviewResponse> => {
    const deleted = await AdminReviewRepository.deleteReviewById(db, reviewId);
    if (!deleted) {
        throw new ReviewError(ReviewErrorCodes.ReviewNotFound);
    }
    return { id: deleted.id };
};

export const AdminReviewService = {
    getReviewList,
    getReviewCounts,
    getReviewDetail,
    setReviewStatus,
    deleteReview,
};
