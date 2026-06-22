import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@waymate/ui";
import { AdminNavbar } from "../../components/navigation/AdminNavbar";
import { useAdminNavbarProps } from "../../features/admin/hooks/useAdminNavbarProps";
import { useSetReviewStatus } from "./-reviews/hooks/useSetReviewStatus";
import { useDeleteReview } from "./-reviews/hooks/useDeleteReview";
import {
    getGetAdminReviewsQueryKey,
    getGetAdminReviewsCountsQueryKey,
} from "../../api-client/admin/admin";
import type { AdminReviewListItem } from "../../api-client/model/adminReviewListItem";
import type { ReviewStatus } from "../../api-client/model/reviewStatus";
import type { GetAdminReviewsSubjectRole } from "../../api-client/model/getAdminReviewsSubjectRole";
import { getErrorCode, getErrorI18nKey } from "../../lib/api-errors";
import { AdminReviewsFilters } from "./-reviews/components/AdminReviewsFilters";
import { AdminReviewsTable } from "./-reviews/components/AdminReviewsTable";
import { ReviewDetailModal } from "./-reviews/components/ReviewDetailModal";
import { SetReviewStatusModal } from "./-reviews/components/SetReviewStatusModal";
import { DeleteReviewModal } from "./-reviews/components/DeleteReviewModal";
import { useAdminReviewsList } from "./-reviews/hooks/useAdminReviewsList";
import { useDebounced } from "../../hooks/shared/useDebounced";
import {
    ADMIN_REVIEW_NOT_FOUND_CODE,
    adminReviewsErrorMap,
} from "./-reviews/lib/admin-review-errors";
import { authClient } from "../../lib/auth-client";
import { getDisplayName } from "../../lib/session-user";
import { requireAudience } from "../../lib/route-guards";
import { useLayout } from "../../lib/use-layout";

export const Route = createFileRoute("/admin/reviews")({
    beforeLoad: requireAudience(["admin"]),
    component: AdminReviewsPage,
});

type StatusFilter = "ALL" | ReviewStatus;

const SEARCH_DEBOUNCE_MS = 300;

function AdminReviewsPage() {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const { language, theme, onLanguageChange, onThemeToggle } = useLayout();
    const { data: session } = authClient.useSession();
    const user = session?.user;
    const userName = user ? getDisplayName(user) : undefined;
    const userEmail = user?.email;
    const navbarProps = useAdminNavbarProps({
        activeTab: "reviews",
        language,
        onLanguageChange,
        theme,
        onThemeToggle,
        userName,
        userEmail,
    });

    const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
    const [ratingFilter, setRatingFilter] = useState<number | null>(null);
    const [targetRoleFilter, setTargetRoleFilter] =
        useState<GetAdminReviewsSubjectRole | null>(null);
    const [searchInput, setSearchInput] = useState("");
    const debouncedSearch = useDebounced(searchInput, SEARCH_DEBOUNCE_MS);

    const trimmedSearch = debouncedSearch.trim();
    const list = useAdminReviewsList({
        status: statusFilter === "ALL" ? undefined : statusFilter,
        minRating: ratingFilter ?? undefined,
        maxRating: ratingFilter ?? undefined,
        subjectRole: targetRoleFilter ?? undefined,
        search: trimmedSearch.length > 0 ? trimmedSearch : undefined,
    });

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
                    queryKey: getGetAdminReviewsQueryKey(),
                });
                void queryClient.invalidateQueries({
                    queryKey: getGetAdminReviewsCountsQueryKey(),
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
            <AdminNavbar {...navbarProps} />

            <div className="w-full px-4 sm:max-w-6xl sm:mx-auto sm:px-8 py-8">
                <h1 className="text-2xl font-bold text-text-primary">
                    {t("admin.reviewsTitle")}
                </h1>
                <p className="text-text-secondary text-sm mt-1 mb-6">
                    {t("admin.reviewsSubtitle")}
                </p>

                <AdminReviewsFilters
                    statusFilter={statusFilter}
                    onStatusFilterChange={setStatusFilter}
                    ratingFilter={ratingFilter}
                    onRatingFilterChange={setRatingFilter}
                    targetRoleFilter={targetRoleFilter}
                    onTargetRoleFilterChange={setTargetRoleFilter}
                    searchInput={searchInput}
                    onSearchInputChange={setSearchInput}
                />

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
