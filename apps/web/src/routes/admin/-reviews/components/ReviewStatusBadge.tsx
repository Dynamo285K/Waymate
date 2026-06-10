import type { ReviewStatus } from "../../../../api-client/model/reviewStatus";
import {
    REVIEW_STATUS_BADGE_CLASSES,
    useReviewStatusLabels,
} from "../lib/admin-review-labels";

export function ReviewStatusBadge({ status }: { status: ReviewStatus }) {
    const labels = useReviewStatusLabels();
    return (
        <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${REVIEW_STATUS_BADGE_CLASSES[status]}`}
        >
            {labels[status]}
        </span>
    );
}
