import { useTranslation } from "react-i18next";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@waymate/ui";
import { getErrorI18nKey } from "../../../lib/api-errors";
import { AdminReviewsFilters } from "./-components/AdminReviewsFilters";
import { AdminReviewsTable } from "./-components/AdminReviewsTable";
import { ReviewDetailModal } from "./-components/ReviewDetailModal";
import { SetReviewStatusModal } from "./-components/SetReviewStatusModal";
import { DeleteReviewModal } from "./-components/DeleteReviewModal";
import { useAdminReviewsList } from "./-hooks/useAdminReviewsList";
import { useReviewsFilters } from "./-hooks/useReviewsFilters";
import { useAdminReviewsActions } from "./-hooks/useAdminReviewsActions";
import { adminReviewsErrorMap } from "./-lib/admin-review-errors";
import { useLayout } from "../../../lib/use-layout";

export const Route = createFileRoute("/admin/reviews/")({
    component: AdminReviewsPage,
});

function AdminReviewsPage() {
    const { t } = useTranslation();
    const { theme } = useLayout();

    const filters = useReviewsFilters();
    const list = useAdminReviewsList(filters.queryParams);
    const actions = useAdminReviewsActions(list.items);

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
                                rowMutatingId={actions.rowMutatingId}
                                onView={(r) => actions.openDetail(r.id)}
                                onToggleVisibility={
                                    actions.handleToggleVisibility
                                }
                                onDelete={actions.handleDeleteClick}
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

            {actions.selectedReviewId && actions.isDetailOpen && (
                <ReviewDetailModal
                    key={actions.selectedReviewId}
                    theme={theme}
                    reviewId={actions.selectedReviewId}
                    isThisReviewMutating={actions.detailIsMutating}
                    mutationErrorForThisReview={actions.detailError}
                    onClose={() => actions.openDetail(null)}
                    onRequestStatus={actions.requestStatus}
                    onRequestDelete={actions.requestDeleteById}
                />
            )}

            {actions.selectedReviewId && actions.pendingStatus && (
                <SetReviewStatusModal
                    key={`${actions.selectedReviewId}-${actions.pendingStatus}`}
                    theme={theme}
                    targetStatus={actions.pendingStatus}
                    isPending={actions.statusModalIsPending}
                    error={actions.statusModalError}
                    onClose={actions.closeStatusModal}
                    onConfirm={actions.handleConfirmStatus}
                />
            )}

            {actions.deleteTarget && (
                <DeleteReviewModal
                    key={actions.deleteTarget.id}
                    theme={theme}
                    isPending={actions.deleteModalIsPending}
                    error={actions.deleteModalError}
                    onClose={actions.closeDeleteModal}
                    onConfirm={actions.handleConfirmDelete}
                />
            )}
        </div>
    );
}
