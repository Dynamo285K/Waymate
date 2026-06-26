import { useTranslation } from "react-i18next";
import {
    Avatar,
    Button,
    EyeIcon,
    EyeOffIcon,
    Modal,
    TrashIcon,
} from "@waymate/ui";
import { useGetReviewsAdminById } from "../../../../api-client/reviews/reviews";
import type { ReviewStatus } from "../../../../api-client/model/reviewStatus";
import { getErrorI18nKey } from "../../../../lib/api-errors";
import { adminReviewsErrorMap } from "../-lib/admin-review-errors";
import {
    fullName,
    formatDate,
} from "../../../../features/admin/lib/admin-format";
import {
    AdminModalActions,
    AdminModalBody,
    AdminModalHeader,
    adminActionButtonClass,
    adminLabelClass,
    adminPanelClass,
    adminTextPanelClass,
} from "../../-components/AdminModalLayout";
import { RatingStars } from "./RatingStars";
import { ReviewStatusBadge } from "./ReviewStatusBadge";
import { ReviewStatusHistoryEntry } from "./ReviewStatusHistoryEntry";

type ReviewDetailModalProps = {
    theme: "light" | "dark";
    reviewId: string;
    isThisReviewMutating: boolean;
    mutationErrorForThisReview: unknown;
    onClose: () => void;
    onRequestStatus: (target: ReviewStatus) => void;
    onRequestDelete: (id: string) => void;
};

export function ReviewDetailModal({
    theme,
    reviewId,
    isThisReviewMutating,
    mutationErrorForThisReview,
    onClose,
    onRequestStatus,
    onRequestDelete,
}: ReviewDetailModalProps) {
    const { t } = useTranslation();
    const detailQuery = useGetReviewsAdminById(reviewId);

    const data = detailQuery.data;
    const authorName = data
        ? fullName(data.review.author.firstName, data.review.author.lastName) ||
          data.review.author.email
        : "";
    const subjectName = data
        ? fullName(
              data.review.subject.firstName,
              data.review.subject.lastName
          ) || data.review.subject.email
        : "";

    return (
        <Modal
            open={true}
            onClose={onClose}
            theme={theme}
        >
            <AdminModalBody>
                <AdminModalHeader
                    title={t("admin.reviewDetail")}
                    onClose={onClose}
                />

                {detailQuery.isLoading && (
                    <p className="text-text-secondary">
                        {t("admin.loadingReviews")}
                    </p>
                )}

                {!detailQuery.isLoading && detailQuery.isError && (
                    <p className="text-danger-text">
                        {t(
                            getErrorI18nKey(
                                detailQuery.error,
                                adminReviewsErrorMap
                            )
                        )}
                    </p>
                )}

                {!detailQuery.isLoading && data && (
                    <>
                        <div
                            className={`${adminPanelClass} grid grid-cols-1 gap-4 mb-6 sm:grid-cols-3 sm:items-center`}
                        >
                            <div className="flex items-center gap-2 min-w-0">
                                <Avatar
                                    name={authorName}
                                    size="sm"
                                />
                                <div className="min-w-0">
                                    <p className="text-xs text-text-secondary uppercase tracking-wider mb-0.5">
                                        {t("admin.reviewer")}
                                    </p>
                                    <p className="text-sm font-semibold text-text-primary break-words">
                                        {authorName}
                                    </p>
                                    <p className="text-xs text-text-secondary">
                                        {data.review.authorRole === "DRIVER"
                                            ? t("admin.driver")
                                            : t("admin.passenger")}
                                    </p>
                                </div>
                            </div>
                            <span className="hidden text-text-secondary sm:block">
                                →
                            </span>
                            <div className="flex items-center gap-2 min-w-0">
                                <Avatar
                                    name={subjectName}
                                    size="sm"
                                />
                                <div className="min-w-0">
                                    <p className="text-xs text-text-secondary uppercase tracking-wider mb-0.5">
                                        {t("admin.target")}
                                    </p>
                                    <p className="text-sm font-semibold text-text-primary break-words">
                                        {subjectName}
                                    </p>
                                    <p className="text-xs text-text-secondary">
                                        {data.review.subjectRole === "DRIVER"
                                            ? t("admin.driver")
                                            : t("admin.passenger")}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col items-start gap-3 mb-6 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex flex-wrap items-center gap-3 min-w-0">
                                <RatingStars rating={data.review.rating} />
                                <span className="text-sm text-text-secondary">
                                    {formatDate(data.review.createdAt, "—")}
                                </span>
                            </div>
                            <ReviewStatusBadge
                                status={data.review.reviewStatus}
                            />
                        </div>

                        <div className={`${adminPanelClass} mb-6`}>
                            <p className={adminLabelClass}>
                                {t("admin.rideContext")}
                            </p>
                            <p className="text-sm font-semibold text-text-primary">
                                {data.review.ride.originCity} →{" "}
                                {data.review.ride.destinationCity}
                            </p>
                            <p className="text-xs text-text-secondary mt-1">
                                {formatDate(data.review.ride.departureAt, "—")}
                            </p>
                        </div>

                        <div className="mb-6">
                            <p className={adminLabelClass}>
                                {t("admin.comment")}
                            </p>
                            {data.review.comment ? (
                                <p className={adminTextPanelClass}>
                                    "{data.review.comment}"
                                </p>
                            ) : (
                                <p className="text-sm text-text-secondary italic">
                                    {t("admin.noComment")}
                                </p>
                            )}
                        </div>

                        {mutationErrorForThisReview !== null &&
                            mutationErrorForThisReview !== undefined && (
                                <p className="text-sm text-danger-text mb-4">
                                    {t(
                                        getErrorI18nKey(
                                            mutationErrorForThisReview,
                                            adminReviewsErrorMap
                                        )
                                    )}
                                </p>
                            )}

                        <div className="mb-6">
                            <AdminModalActions>
                                <Button
                                    variant="red"
                                    leftIcon={<TrashIcon />}
                                    className={adminActionButtonClass}
                                    onClick={() => onRequestDelete(reviewId)}
                                    disabled={isThisReviewMutating}
                                >
                                    {t("admin.deleteReview")}
                                </Button>
                                {data.review.reviewStatus !== "VISIBLE" && (
                                    <Button
                                        variant="primary"
                                        leftIcon={<EyeIcon />}
                                        className={adminActionButtonClass}
                                        onClick={() =>
                                            onRequestStatus("VISIBLE")
                                        }
                                        disabled={isThisReviewMutating}
                                    >
                                        {t("admin.showReview")}
                                    </Button>
                                )}
                                {data.review.reviewStatus !== "HIDDEN" && (
                                    <Button
                                        variant="outlineSuccess"
                                        leftIcon={<EyeOffIcon />}
                                        className={adminActionButtonClass}
                                        onClick={() =>
                                            onRequestStatus("HIDDEN")
                                        }
                                        disabled={isThisReviewMutating}
                                    >
                                        {t("admin.hideReview")}
                                    </Button>
                                )}
                            </AdminModalActions>
                        </div>

                        <h3 className="text-base font-bold text-text-primary mb-3">
                            {t("admin.statusHistory")}
                        </h3>
                        {data.statusHistory.length === 0 ? (
                            <p className="text-sm text-text-secondary">
                                {t("admin.noStatusHistory")}
                            </p>
                        ) : (
                            <ul className="flex flex-col gap-2">
                                {data.statusHistory.map((entry) => (
                                    <ReviewStatusHistoryEntry
                                        key={entry.id}
                                        entry={entry}
                                    />
                                ))}
                            </ul>
                        )}
                    </>
                )}
            </AdminModalBody>
        </Modal>
    );
}
