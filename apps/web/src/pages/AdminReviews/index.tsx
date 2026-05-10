import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@waymate/ui";
import type { Language } from "../../components/controls/LanguageSwitcher";
import { AdminNavbar } from "../../components/navigation/AdminNavbar";
import { useAdminNavbarProps } from "../../hooks/useAdminNavbarProps";
import { useSetReviewStatus } from "../../hooks/useSetReviewStatus";
import { getGetAdminReviewsQueryKey } from "../../api-client/admin/admin";
import type { ReviewStatus } from "../../api-client/model/reviewStatus";
import { getErrorCode, getErrorI18nKey } from "../../lib/api-errors";
import { AdminReviewsFilters } from "./components/AdminReviewsFilters";
import { AdminReviewsTable } from "./components/AdminReviewsTable";
import { ReviewDetailModal } from "./components/ReviewDetailModal";
import { SetReviewStatusModal } from "./components/SetReviewStatusModal";
import { useAdminReviewsList } from "./hooks/useAdminReviewsList";
import { useDebounced } from "./hooks/useDebounced";
import {
    ADMIN_REVIEW_NOT_FOUND_CODE,
    adminReviewsErrorMap,
} from "./lib/errors";

type AdminReviewsPageProps = {
    language: Language;
    theme: "light" | "dark";
    onLanguageChange: (lang: Language) => void;
    onThemeToggle: () => void;
    userName?: string;
    userEmail?: string;
};

type StatusFilter = "ALL" | ReviewStatus;
type RatingFilter = "ALL" | "LOW";

const SEARCH_DEBOUNCE_MS = 300;
// "Low rating" threshold for the quick toggle. Reviews of 1 or 2 stars are
// the moderation hot zone — surfacing them in one click keeps the noise
// down without requiring a numeric range UI.
const LOW_RATING_MAX = 2;

export function AdminReviewsPage({
    language,
    theme,
    onLanguageChange,
    onThemeToggle,
    userName,
    userEmail,
}: AdminReviewsPageProps) {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
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
    const [ratingFilter, setRatingFilter] = useState<RatingFilter>("ALL");
    const [searchInput, setSearchInput] = useState("");
    const debouncedSearch = useDebounced(searchInput, SEARCH_DEBOUNCE_MS);

    const trimmedSearch = debouncedSearch.trim();
    const list = useAdminReviewsList({
        status: statusFilter === "ALL" ? undefined : statusFilter,
        maxRating: ratingFilter === "LOW" ? LOW_RATING_MAX : undefined,
        search: trimmedSearch.length > 0 ? trimmedSearch : undefined,
    });

    const [selectedReviewId, setSelectedReviewId] = useState<string | null>(
        null
    );
    const [pendingStatus, setPendingStatus] = useState<ReviewStatus | null>(
        null
    );

    const setReviewStatus = useSetReviewStatus();

    const rowMutatingId = setReviewStatus.isPending
        ? (setReviewStatus.variables?.id ?? null)
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
                setSelectedReviewId(null);
                setPendingStatus(null);
            }
        },
        [queryClient]
    );

    const handleConfirm = (reason: string) => {
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

    const openDetail = (id: string | null) => {
        setReviewStatus.reset();
        setPendingStatus(null);
        setSelectedReviewId(id);
    };

    return (
        <div
            data-theme={theme}
            className="min-h-screen bg-(--color-bg)"
        >
            <AdminNavbar {...navbarProps} />

            <div className="w-full px-4 sm:max-w-6xl sm:mx-auto sm:px-8 py-8">
                <h1 className="text-2xl font-bold text-(--color-text-primary)">
                    {t("admin.reviewsTitle")}
                </h1>
                <p className="text-(--color-text-secondary) text-sm mt-1 mb-6">
                    {t("admin.reviewsSubtitle")}
                </p>

                <AdminReviewsFilters
                    statusFilter={statusFilter}
                    onStatusFilterChange={setStatusFilter}
                    ratingFilter={ratingFilter}
                    onRatingFilterChange={setRatingFilter}
                    searchInput={searchInput}
                    onSearchInputChange={setSearchInput}
                />

                {list.isInitialLoading && (
                    <p className="text-(--color-text-secondary) py-4">
                        {t("admin.loadingReviews")}
                    </p>
                )}

                {!list.isInitialLoading && list.isError && (
                    <p className="text-(--color-danger-text) py-4">
                        {t(getErrorI18nKey(list.error, adminReviewsErrorMap))}
                    </p>
                )}

                {!list.isInitialLoading &&
                    !list.isError &&
                    list.items.length === 0 && (
                        <p className="text-(--color-text-secondary) py-4">
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

            {selectedReviewId && (
                <ReviewDetailModal
                    key={selectedReviewId}
                    reviewId={selectedReviewId}
                    isThisReviewMutating={detailIsMutating}
                    mutationErrorForThisReview={detailErrorForReview}
                    onClose={() => openDetail(null)}
                    onRequestStatus={(target) => setPendingStatus(target)}
                />
            )}

            {selectedReviewId && pendingStatus && (
                <SetReviewStatusModal
                    key={`${selectedReviewId}-${pendingStatus}`}
                    targetStatus={pendingStatus}
                    isPending={rowMutatingId === selectedReviewId}
                    error={modalError}
                    onClose={() => setPendingStatus(null)}
                    onConfirm={handleConfirm}
                />
            )}
        </div>
    );
}
