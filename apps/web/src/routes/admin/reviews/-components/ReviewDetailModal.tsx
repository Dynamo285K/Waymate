import { useTranslation } from "react-i18next";
import {
    Avatar,
    Button,
    CloseIcon,
    EyeIcon,
    EyeOffIcon,
    IconButton,
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

    const labelClass =
        "text-xs font-bold text-text-secondary tracking-wider mb-1 block";

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
            <div className="w-modal-viewport max-w-2xl p-8 max-h-modal-body overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-text-primary">
                        {t("admin.reviewDetail")}
                    </h2>
                    <IconButton
                        ariaLabel="Close"
                        icon={<CloseIcon />}
                        variant="ghost"
                        onClick={onClose}
                    />
                </div>

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
                        <div className="flex items-center gap-4 mb-6 p-4 border border-border rounded-xl">
                            <div className="flex items-center gap-2">
                                <Avatar
                                    name={authorName}
                                    size="sm"
                                />
                                <div>
                                    <p className="text-xs text-text-secondary uppercase tracking-wider mb-0.5">
                                        {t("admin.reviewer")}
                                    </p>
                                    <p className="text-sm font-semibold text-text-primary">
                                        {authorName}
                                    </p>
                                    <p className="text-xs text-text-secondary">
                                        {data.review.authorRole === "DRIVER"
                                            ? t("admin.driver")
                                            : t("admin.passenger")}
                                    </p>
                                </div>
                            </div>
                            <span className="text-text-secondary mx-2">→</span>
                            <div className="flex items-center gap-2">
                                <Avatar
                                    name={subjectName}
                                    size="sm"
                                />
                                <div>
                                    <p className="text-xs text-text-secondary uppercase tracking-wider mb-0.5">
                                        {t("admin.target")}
                                    </p>
                                    <p className="text-sm font-semibold text-text-primary">
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

                        <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
                            <div className="flex items-center gap-3">
                                <RatingStars rating={data.review.rating} />
                                <span className="text-sm text-text-secondary">
                                    {formatDate(data.review.createdAt, "—")}
                                </span>
                            </div>
                            <ReviewStatusBadge
                                status={data.review.reviewStatus}
                            />
                        </div>

                        <div className="border border-border rounded-xl p-4 mb-6">
                            <p className={labelClass}>
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
                            <p className={labelClass}>{t("admin.comment")}</p>
                            {data.review.comment ? (
                                <p className="text-sm text-text-primary whitespace-pre-wrap border border-border rounded-xl p-3 bg-background">
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

                        <div className="flex gap-2 flex-wrap mb-6">
                            <Button
                                variant="red"
                                leftIcon={<TrashIcon />}
                                onClick={() => onRequestDelete(reviewId)}
                                disabled={isThisReviewMutating}
                            >
                                {t("admin.deleteReview")}
                            </Button>
                            {data.review.reviewStatus !== "VISIBLE" && (
                                <Button
                                    variant="primary"
                                    leftIcon={<EyeIcon />}
                                    onClick={() => onRequestStatus("VISIBLE")}
                                    disabled={isThisReviewMutating}
                                >
                                    {t("admin.showReview")}
                                </Button>
                            )}
                            {data.review.reviewStatus !== "HIDDEN" && (
                                <Button
                                    variant="outlineSuccess"
                                    leftIcon={<EyeOffIcon />}
                                    onClick={() => onRequestStatus("HIDDEN")}
                                    disabled={isThisReviewMutating}
                                >
                                    {t("admin.hideReview")}
                                </Button>
                            )}
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
            </div>
        </Modal>
    );
}
