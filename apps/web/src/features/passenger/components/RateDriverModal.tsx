import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { RatingStars } from "@/components/ui/RatingStars";

export interface RateDriverModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: { rating: number; review: string }) => void;
    driverName?: string;
    initialRating?: number;
    initialReview?: string;
    title?: string;
    submitLabel?: string;
    placeholder?: string;
    isSubmitting?: boolean;
    theme?: string;
}

export function RateDriverModal({
    open,
    onOpenChange,
    onSubmit,
    driverName,
    initialRating = 0,
    initialReview = "",
    title,
    submitLabel = "Submit rating",
    placeholder = "Write a review...",
    isSubmitting = false,
    theme,
}: RateDriverModalProps) {
    const [rating, setRating] = useState(initialRating);
    const [review, setReview] = useState(initialReview);

    useEffect(() => {
        if (open) {
            setRating(initialRating);
            setReview(initialReview);
        }
    }, [open, initialRating, initialReview]);

    const resolvedTitle =
        title ?? (driverName ? `Rate ${driverName}` : "Rate your driver");

    const handleSubmit = () => {
        if (rating === 0 || isSubmitting) return;
        onSubmit({ rating, review: review.trim() });
    };

    return (
        <Modal
            open={open}
            onClose={() => onOpenChange(false)}
            theme={theme}
        >
            <div className="w-modal py-10 pb-9 px-12 max-sm:py-7 max-sm:px-5 max-sm:pb-6 border border-border rounded-3xl max-sm:rounded-[20px] bg-card shadow-modal">
                <div className="mb-6 text-center">
                    <h2 className="text-title max-sm:text-mobile-title font-bold leading-[1.2] text-text-primary">
                        {resolvedTitle}
                    </h2>
                </div>

                <div className="flex flex-col items-center gap-7">
                    <div className="flex items-center justify-center gap-3.5 max-sm:gap-2.5">
                        <RatingStars
                            value={rating}
                            onChange={setRating}
                            interactive
                            size="lg"
                        />
                    </div>

                    <textarea
                        className="w-full min-h-28 py-[18px] px-5 border border-border rounded-[18px] bg-input text-text-primary text-base leading-6 resize-none box-border placeholder:text-text-secondary outline-none focus:border-primary"
                        placeholder={placeholder}
                        value={review}
                        onChange={(event) => setReview(event.target.value)}
                        rows={4}
                    />

                    <div className="flex justify-center w-full">
                        <Button
                            className="min-w-[260px]"
                            onClick={handleSubmit}
                            disabled={rating === 0 || isSubmitting}
                        >
                            {submitLabel}
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
