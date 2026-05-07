import { useTranslation } from "react-i18next";
import { Avatar } from "@waymate/ui";
import type { AdminReviewListItem } from "../../../api-client/model/adminReviewListItem";
import { fullName, formatDate } from "../lib/format";
import { RatingStars } from "./RatingStars";
import { ReviewStatusBadge } from "./ReviewStatusBadge";

type AdminReviewsTableProps = {
    items: AdminReviewListItem[];
    rowMutatingId: string | null;
    onView: (review: AdminReviewListItem) => void;
};

export function AdminReviewsTable({
    items,
    rowMutatingId,
    onView,
}: AdminReviewsTableProps) {
    const { t } = useTranslation();

    return (
        <div className="bg-(--color-card) rounded-2xl border border-(--color-border) overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-(--color-border)">
                        {[
                            t("admin.author"),
                            t("admin.subject"),
                            t("admin.rating"),
                            t("admin.comment"),
                            t("admin.status"),
                            t("admin.created"),
                            t("admin.actions"),
                        ].map((h) => (
                            <th
                                key={h}
                                className="text-left text-xs font-bold text-(--color-text-secondary) tracking-wider px-5 py-4"
                            >
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {items.map((review) => {
                        const authorName =
                            fullName(
                                review.author.firstName,
                                review.author.lastName
                            ) || review.author.email;
                        const subjectName =
                            fullName(
                                review.subject.firstName,
                                review.subject.lastName
                            ) || review.subject.email;
                        const isThisRowMutating = rowMutatingId === review.id;
                        return (
                            <tr
                                key={review.id}
                                className={`border-b border-(--color-border) last:border-0 hover:bg-(--color-bg) transition-colors ${
                                    isThisRowMutating ? "opacity-60" : ""
                                }`}
                            >
                                <td className="px-5 py-4">
                                    <div className="flex items-center gap-2">
                                        <Avatar
                                            name={authorName}
                                            size="sm"
                                        />
                                        <span className="font-semibold text-(--color-text-primary) whitespace-nowrap">
                                            {authorName}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-5 py-4">
                                    <div className="flex items-center gap-2">
                                        <Avatar
                                            name={subjectName}
                                            size="sm"
                                        />
                                        <span className="font-semibold text-(--color-text-primary) whitespace-nowrap">
                                            {subjectName}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-5 py-4 whitespace-nowrap">
                                    <RatingStars rating={review.rating} />
                                </td>
                                <td className="px-5 py-4 max-w-md">
                                    <p className="text-(--color-text-primary) line-clamp-2">
                                        {review.comment ?? (
                                            <span className="text-(--color-text-secondary) italic">
                                                {t("admin.noComment")}
                                            </span>
                                        )}
                                    </p>
                                </td>
                                <td className="px-5 py-4">
                                    <ReviewStatusBadge
                                        status={review.reviewStatus}
                                    />
                                </td>
                                <td className="px-5 py-4 text-(--color-text-secondary) whitespace-nowrap">
                                    {formatDate(review.createdAt, "—")}
                                </td>
                                <td className="px-5 py-4">
                                    <button
                                        onClick={() => onView(review)}
                                        className="px-3 py-1.5 border border-(--color-border) rounded-lg text-sm font-medium text-(--color-text-secondary) hover:bg-(--color-border) transition-colors"
                                    >
                                        {t("admin.view")}
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
