import { useTranslation } from "react-i18next";
import { Avatar, CloseIcon, IconButton, Modal, StarIcon } from "@waymate/ui";
import { useGetReviewsUsersByUserId } from "../../api-client/reviews/reviews";
import { useLayout } from "../../lib/use-layout";

type UserProfileModalProps = {
    userId: string;
    name: string;
    onClose: () => void;
};

// Lightweight public profile preview for a chat counterpart: avatar, name,
// aggregate rating and recent reviews. There is no public user endpoint yet, so
// the identity comes from the caller (the conversation) and the rating/reviews
// from the reviews-by-user endpoint.
export function UserProfileModal({
    userId,
    name,
    onClose,
}: UserProfileModalProps) {
    const { t } = useTranslation();
    const { theme } = useLayout();
    const { data, isLoading } = useGetReviewsUsersByUserId(userId);

    const reviews = (data?.reviews ?? []).filter((r) => r.comment?.trim());

    return (
        <Modal
            open={true}
            onClose={onClose}
            theme={theme}
        >
            <div className="w-full min-w-0 max-w-md p-5 sm:p-6 max-h-profile-modal-body overflow-y-auto">
                <div className="flex justify-end">
                    <IconButton
                        ariaLabel={t("chat.back")}
                        icon={<CloseIcon />}
                        variant="ghost"
                        onClick={onClose}
                    />
                </div>

                <div className="flex flex-col items-center text-center gap-2 mb-5">
                    <Avatar
                        name={name}
                        size="lg"
                    />
                    <h2 className="text-lg font-bold text-text-primary break-words">
                        {name}
                    </h2>
                    {data && data.averageRating != null ? (
                        <div className="flex items-center gap-1.5 icon-svg:w-4 icon-svg:h-4 icon-svg:text-dark-yellow icon-svg:fill-dark-yellow icon-svg:shrink-0">
                            <StarIcon />
                            <span className="text-sm text-text-secondary">
                                {data.averageRating.toFixed(1)} ·{" "}
                                {t("chat.reviewsCount", {
                                    count: data.reviewCount,
                                })}
                            </span>
                        </div>
                    ) : (
                        !isLoading && (
                            <span className="text-sm text-text-secondary">
                                {t("chat.noReviews")}
                            </span>
                        )
                    )}
                </div>

                {reviews.length > 0 && (
                    <ul className="flex flex-col gap-3">
                        {reviews.map((review) => {
                            const author =
                                [
                                    review.author.firstName,
                                    review.author.lastName,
                                ]
                                    .filter(Boolean)
                                    .join(" ")
                                    .trim() || t("chat.unknownUser");
                            return (
                                <li
                                    key={review.id}
                                    className="border border-border rounded-xl p-3"
                                >
                                    <div className="flex items-center gap-1.5 mb-1 icon-svg:w-3.5 icon-svg:h-3.5 icon-svg:text-dark-yellow icon-svg:fill-dark-yellow icon-svg:shrink-0">
                                        <StarIcon />
                                        <span className="text-xs font-semibold text-text-primary">
                                            {review.rating.toFixed(1)}
                                        </span>
                                        <span className="text-xs text-text-secondary break-words">
                                            · {author}
                                        </span>
                                    </div>
                                    <p className="text-sm text-text-primary whitespace-pre-wrap break-words">
                                        {review.comment}
                                    </p>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </Modal>
    );
}
