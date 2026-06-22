import { useTranslation } from "react-i18next";
import { Button, IconButton } from "@waymate/ui";
import { EyeIcon, EyeOffIcon, TrashIcon } from "@waymate/ui";
import type { AdminReviewListItem } from "../../../../api-client/model/adminReviewListItem";
import {
    fullName,
    formatDate,
} from "../../../../features/admin/lib/admin-format";
import { RatingStars } from "./RatingStars";
import { ReviewStatusBadge } from "./ReviewStatusBadge";

type AdminReviewsTableProps = {
    items: AdminReviewListItem[];
    rowMutatingId: string | null;
    onView: (review: AdminReviewListItem) => void;
    onToggleVisibility: (review: AdminReviewListItem) => void;
    onDelete: (review: AdminReviewListItem) => void;
};

export function AdminReviewsTable({
    items,
    rowMutatingId,
    onView,
    onToggleVisibility,
    onDelete,
}: AdminReviewsTableProps) {
    const { t } = useTranslation();

    const headers = [
        t("admin.reviewer"),
        t("admin.target"),
        t("admin.rating"),
        t("admin.comment"),
        t("admin.ride"),
        t("admin.date"),
        t("admin.status"),
        t("admin.actions"),
    ];

    return (
        <div className="bg-card rounded-2xl border border-border overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-border">
                        {headers.map((h) => (
                            <th
                                key={h}
                                className="text-left text-xs font-bold text-text-secondary tracking-wider px-3 py-4 whitespace-nowrap"
                            >
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {items.map((review) => {
                        const reviewerName =
                            fullName(
                                review.author.firstName,
                                review.author.lastName
                            ) || review.author.email;
                        const targetName =
                            fullName(
                                review.subject.firstName,
                                review.subject.lastName
                            ) || review.subject.email;
                        const isMutating = rowMutatingId === review.id;

                        return (
                            <tr
                                key={review.id}
                                className={`border-b border-border last:border-0 hover:bg-background transition-colors ${
                                    isMutating ? "opacity-60" : ""
                                }`}
                            >
                                <td className="px-3 py-4">
                                    <p className="font-medium text-text-primary whitespace-nowrap text-sm">
                                        {reviewerName}
                                    </p>
                                    <p className="text-xs text-text-secondary">
                                        {review.authorRole === "DRIVER"
                                            ? t("admin.driver")
                                            : t("admin.passenger")}
                                    </p>
                                </td>

                                <td className="px-3 py-4">
                                    <p className="font-medium text-text-primary whitespace-nowrap text-sm">
                                        {targetName}
                                    </p>
                                    <p className="text-xs text-text-secondary">
                                        {review.subjectRole === "DRIVER"
                                            ? t("admin.driver")
                                            : t("admin.passenger")}
                                    </p>
                                </td>

                                <td className="px-3 py-4 whitespace-nowrap">
                                    <RatingStars rating={review.rating} />
                                </td>

                                <td className="px-3 py-4 max-w-admin-table-user">
                                    <p className="text-text-primary truncate text-sm">
                                        {review.comment ?? (
                                            <span className="text-text-secondary italic">
                                                {t("admin.noComment")}
                                            </span>
                                        )}
                                    </p>
                                </td>

                                <td className="px-3 py-4 whitespace-nowrap">
                                    <p className="text-xs text-text-secondary">
                                        {review.ride.originCity} →{" "}
                                        {review.ride.destinationCity}
                                    </p>
                                </td>

                                <td className="px-3 py-4 text-text-secondary whitespace-nowrap text-xs">
                                    {formatDate(review.createdAt, "—")}
                                </td>

                                <td className="px-3 py-4 whitespace-nowrap">
                                    <ReviewStatusBadge
                                        status={review.reviewStatus}
                                    />
                                </td>

                                <td className="px-3 py-4">
                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="secondary"
                                            onClick={() => onView(review)}
                                            disabled={isMutating}
                                        >
                                            {t("admin.view")}
                                        </Button>
                                        <IconButton
                                            ariaLabel={
                                                review.reviewStatus ===
                                                "VISIBLE"
                                                    ? t("admin.hideReview")
                                                    : t("admin.showReview")
                                            }
                                            icon={
                                                review.reviewStatus ===
                                                "VISIBLE" ? (
                                                    <EyeOffIcon />
                                                ) : (
                                                    <EyeIcon />
                                                )
                                            }
                                            variant="ghost"
                                            onClick={() =>
                                                onToggleVisibility(review)
                                            }
                                            disabled={isMutating}
                                        />
                                        <span className="text-red">
                                            <IconButton
                                                ariaLabel={t(
                                                    "admin.deleteReview"
                                                )}
                                                icon={<TrashIcon />}
                                                variant="ghost"
                                                onClick={() => onDelete(review)}
                                                disabled={isMutating}
                                            />
                                        </span>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
