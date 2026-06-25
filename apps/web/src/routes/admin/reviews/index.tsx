import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@waymate/ui";
import { useSetReviewStatus } from "./-hooks/useSetReviewStatus";
import { useDeleteReview } from "./-hooks/useDeleteReview";
import {
    getGetReviewsAdminQueryKey,
    getGetReviewsAdminCountsQueryKey,
} from "../../../api-client/reviews/reviews";
import type { AdminReviewListItem } from "../../../api-client/model/adminReviewListItem";
import type { ReviewStatus } from "../../../api-client/model/reviewStatus";
import { getErrorCode, getErrorI18nKey } from "../../../lib/api-errors";
import { AdminReviewsFilters } from "./-components/AdminReviewsFilters";
import { AdminReviewsTable } from "./-components/AdminReviewsTable";
import { ReviewDetailModal } from "./-components/ReviewDetailModal";
import { SetReviewStatusModal } from "./-components/SetReviewStatusModal";
import { DeleteReviewModal } from "./-components/DeleteReviewModal";
import { useAdminReviewsList } from "./-hooks/useAdminReviewsList";
import { useReviewsFilters } from "./-hooks/useReviewsFilters";
import {
    ADMIN_REVIEW_NOT_FOUND_CODE,
    adminReviewsErrorMap,
} from "./-lib/admin-review-errors";
import { useLayout } from "../../../lib/use-layout";

export const Route = createFileRoute("/admin/reviews/")({
    component: AdminReviewsPage,
});

function AdminReviewsPage() {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const { theme } = useLayout();

    const filters = useReviewsFilters();
    const list = useAdminReviewsList(filters.queryParams);

    const [selectedReviewId, setSelectedReviewId] = useState<string | null>(
        null
    );
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [pendingStatus, setPendingStatus] = useState<ReviewStatus | null>(
        null
    );
    const [deleteTarget, setDeleteTarget] =
        useState<AdminReviewListItem | null>(null);

    const setReviewStatus = useSetReviewStatus();
    const deleteReview = useDeleteReview();

    const rowMutatingId = setReviewStatus.isPending
        ? (setReviewStatus.variables?.id ?? null)
        : deleteReview.isPending
          ? (deleteReview.variables?.id ?? null)
          : null;

    const errorTargetForStatus = setReviewStatus.isError
        ? (setReviewStatus.variables?.id ?? null)
        : null;

    const detailErrorForReview =
        selectedReviewId && errorTargetForStatus === selectedReviewId
            ? setReviewStatus.error
            : null;
    const modalError =
        selectedReviewId && errorTargetForStatus === selectedReviewId
            ? setReviewStatus.error
            : null;

    const detailIsMutating =
        selectedReviewId !== null && rowMutatingId === selectedReviewId;

    const handleMutationFailure = useCallback(
        (error: unknown) => {
            if (getErrorCode(error) === ADMIN_REVIEW_NOT_FOUND_CODE) {
                void queryClient.invalidateQueries({
                    queryKey: getGetReviewsAdminQueryKey(),
                });
                void queryClient.invalidateQueries({
                    queryKey: getGetReviewsAdminCountsQueryKey(),
                });
                setSelectedReviewId(null);
                setIsDetailOpen(false);
                setPendingStatus(null);
                setDeleteTarget(null);
            }
        },
        [queryClient]
    );

    const handleConfirmStatus = (reason: string) => {
        if (!selectedReviewId || !pendingStatus) return;
        setReviewStatus.mutate(
            {
                reviewId: selectedReviewId,
                status: pendingStatus,
                reason,
            },
            {
                onSuccess: () => setPendingStatus(null),
                onError: handleMutationFailure,
            }
        );
    };

    const handleConfirmDelete = () => {
        if (!deleteTarget) return;
        deleteReview.mutate(deleteTarget.id, {
            onSuccess: () => {
                setDeleteTarget(null);
                if (selectedReviewId === deleteTarget.id) {
                    setSelectedReviewId(null);
                }
            },
            onError: handleMutationFailure,
        });
    };

    const openDetail = (id: string | null) => {
        setReviewStatus.reset();
        setPendingStatus(null);
        setSelectedReviewId(id);
        setIsDetailOpen(id !== null);
    };

    const handleToggleVisibility = (review: AdminReviewListItem) => {
        setReviewStatus.reset();
        setSelectedReviewId(review.id);
        setIsDetailOpen(false);
        setPendingStatus(
            review.reviewStatus === "VISIBLE" ? "HIDDEN" : "VISIBLE"
        );
    };

    const handleDeleteClick = (review: AdminReviewListItem) => {
        deleteReview.reset();
        setDeleteTarget(review);
    };

    return (
        <div
            data-theme={theme}
            className="min-h-screen bg-background"
        >
            <div className="w-full px-4 sm:max-w-6xl sm:mx-auto sm:px-8 py-8">
                <h1 className="text-2xl font-bold text-text-primary">
                    {t("admin.reviewsTitle")}
                </h1>
                <p className="text-text-secondary text-sm mt-1 mb-6">
                    {t("admin.reviewsSubtitle")}
                </p>

                <AdminReviewsFilters {...filters.controls} />

                {list.isInitialLoading && (
                    <p className="text-text-secondary py-4">
                        {t("admin.loadingReviews")}
                    </p>
                )}

                {!list.isInitialLoading && list.isError && (
                    <p className="text-danger-text py-4">
                        {t(getErrorI18nKey(list.error, adminReviewsErrorMap))}
                    </p>
                )}

                {!list.isInitialLoading &&
                    !list.isError &&
                    list.items.length === 0 && (
                        <p className="text-text-secondary py-4">
                            {t("admin.noReviewsFound")}
                        </p>
                    )}

                {!list.isInitialLoading &&
                    !list.isError &&
                    list.items.length > 0 && (
                        <>
                            <AdminReviewsTable
                                items={list.items}
                                rowMutatingId={rowMutatingId}
                                onView={(r) => openDetail(r.id)}
                                onToggleVisibility={handleToggleVisibility}
                                onDelete={handleDeleteClick}
                            />

                            {list.nextCursor && (
                                <div className="flex justify-center mt-6">
                                    <Button
                                        variant="secondary"
                                        onClick={list.loadMore}
                                        disabled={list.isFetching}
                                    >
                                        {t("admin.loadMore")}
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
            </div>

            {selectedReviewId && isDetailOpen && (
                <ReviewDetailModal
                    key={selectedReviewId}
                    theme={theme}
                    reviewId={selectedReviewId}
                    isThisReviewMutating={detailIsMutating}
                    mutationErrorForThisReview={detailErrorForReview}
                    onClose={() => openDetail(null)}
                    onRequestStatus={(target) => setPendingStatus(target)}
                    onRequestDelete={(id) => {
                        const item = list.items.find((r) => r.id === id);
                        if (item) handleDeleteClick(item);
                    }}
                />
            )}

            {selectedReviewId && pendingStatus && (
                <SetReviewStatusModal
                    key={`${selectedReviewId}-${pendingStatus}`}
                    theme={theme}
                    targetStatus={pendingStatus}
                    isPending={
                        setReviewStatus.isPending &&
                        setReviewStatus.variables?.id === selectedReviewId
                    }
                    error={modalError}
                    onClose={() => {
                        setPendingStatus(null);
                        if (!isDetailOpen) setSelectedReviewId(null);
                    }}
                    onConfirm={handleConfirmStatus}
                />
            )}

            {deleteTarget && (
                <DeleteReviewModal
                    key={deleteTarget.id}
                    theme={theme}
                    isPending={
                        deleteReview.isPending &&
                        deleteReview.variables?.id === deleteTarget.id
                    }
                    error={
                        deleteReview.isError &&
                        deleteReview.variables?.id === deleteTarget.id
                            ? deleteReview.error
                            : null
                    }
                    onClose={() => setDeleteTarget(null)}
                    onConfirm={handleConfirmDelete}
                />
            )}
        </div>
    );
}
