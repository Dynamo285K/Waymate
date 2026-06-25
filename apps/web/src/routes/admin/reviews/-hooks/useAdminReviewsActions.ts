import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSetReviewStatus } from "./useSetReviewStatus";
import { useDeleteReview } from "./useDeleteReview";
import {
    getGetReviewsAdminQueryKey,
    getGetReviewsAdminCountsQueryKey,
} from "../../../../api-client/reviews/reviews";
import type { AdminReviewListItem } from "../../../../api-client/model/adminReviewListItem";
import type { ReviewStatus } from "../../../../api-client/model/reviewStatus";
import { getErrorCode } from "../../../../lib/api-errors";
import { ADMIN_REVIEW_NOT_FOUND_CODE } from "../-lib/admin-review-errors";

// Owns the detail / status / delete modal orchestration for the admin-reviews
// page: which review is selected, the pending status- and delete-confirmations,
// the per-row mutation state, and the handlers that drive them. Keeping this out
// of the route file lets AdminReviewsPage stay a lean orchestrator that just
// wires `list` + these actions into markup. `items` is needed to resolve the id
// the detail modal hands back into the full row for the delete confirmation.
export function useAdminReviewsActions(items: AdminReviewListItem[]) {
    const queryClient = useQueryClient();

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

    // Surfaced both inside the detail modal and the status-confirm modal.
    const statusError =
        selectedReviewId && errorTargetForStatus === selectedReviewId
            ? setReviewStatus.error
            : null;

    const detailIsMutating =
        selectedReviewId !== null && rowMutatingId === selectedReviewId;

    const statusModalIsPending =
        setReviewStatus.isPending &&
        setReviewStatus.variables?.id === selectedReviewId;

    const deleteModalIsPending =
        deleteReview.isPending &&
        deleteReview.variables?.id === deleteTarget?.id;
    const deleteModalError =
        deleteReview.isError && deleteReview.variables?.id === deleteTarget?.id
            ? deleteReview.error
            : null;

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

    const handleDeleteClick = (review: AdminReviewListItem) => {
        deleteReview.reset();
        setDeleteTarget(review);
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

    const requestDeleteById = (id: string) => {
        const item = items.find((r) => r.id === id);
        if (item) handleDeleteClick(item);
    };

    const closeStatusModal = () => {
        setPendingStatus(null);
        if (!isDetailOpen) setSelectedReviewId(null);
    };

    return {
        rowMutatingId,
        // detail modal
        selectedReviewId,
        isDetailOpen,
        detailIsMutating,
        detailError: statusError,
        openDetail,
        requestDeleteById,
        // status-confirm modal
        pendingStatus,
        requestStatus: setPendingStatus,
        statusModalIsPending,
        statusModalError: statusError,
        handleConfirmStatus,
        closeStatusModal,
        // delete-confirm modal
        deleteTarget,
        deleteModalIsPending,
        deleteModalError,
        handleConfirmDelete,
        closeDeleteModal: () => setDeleteTarget(null),
        // table row actions
        handleToggleVisibility,
        handleDeleteClick,
    };
}
