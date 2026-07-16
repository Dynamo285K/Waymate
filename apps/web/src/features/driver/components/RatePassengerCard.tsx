import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { RatingStars } from "@/components/ui/RatingStars";
import { Input } from "@/components/ui/Input";

export type RatePassengerCardLabels = {
    placeholder?: string;
    submitRating?: string;
    alreadyReviewed?: string;
};

export type RatePassengerCardProps = {
    name: string;
    onSubmit: (rating: number, review: string) => void;
    labels?: RatePassengerCardLabels;
    isSubmitting?: boolean;
    submittedRating?: number | null;
};

export function RatePassengerCard({
    name,
    onSubmit,
    labels,
    isSubmitting = false,
    submittedRating,
}: RatePassengerCardProps) {
    const [rating, setRating] = useState(submittedRating ?? 0);
    const [review, setReview] = useState("");

    const isLocked = submittedRating != null;
    const disabled = isLocked || isSubmitting;

    return (
        <div className="py-5 px-6 bg-card border border-border rounded-2xl max-600:p-4">
            <div className="flex items-start gap-4 max-600:flex-col">
                <Avatar
                    name={name}
                    size="lg"
                />
                <div className="flex flex-col gap-3 flex-1">
                    <div className="flex justify-between items-center max-600:flex-wrap max-600:gap-2">
                        <span className="text-base font-semibold text-text-primary">
                            {name}
                        </span>
                        <RatingStars
                            value={rating}
                            size="lg"
                            interactive={!disabled}
                            onChange={disabled ? undefined : setRating}
                        />
                    </div>
                    {!isLocked && (
                        <div className="flex items-center gap-3 w-full max-600:flex-wrap">
                            <div className="flex-1 max-600:min-w-0 max-600:w-full">
                                <Input
                                    placeholder={
                                        labels?.placeholder ??
                                        "Write a review..."
                                    }
                                    value={review}
                                    onChange={(e) => setReview(e.target.value)}
                                    disabled={isSubmitting}
                                />
                            </div>
                            <Button
                                variant="black"
                                onClick={() => onSubmit(rating, review)}
                                disabled={disabled || rating === 0}
                            >
                                {isSubmitting
                                    ? "…"
                                    : (labels?.submitRating ?? "Submit rating")}
                            </Button>
                        </div>
                    )}
                    {isLocked && (
                        <p className="m-0 text-sm text-text-secondary">
                            {labels?.alreadyReviewed ?? "Rating submitted"}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
