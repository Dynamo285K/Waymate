import { StarIcon } from "@waymate/ui";

export function RatingStars({ rating }: { rating: number }) {
    return (
        <span
            className="inline-flex items-center gap-0.5"
            aria-label={`${rating} / 5`}
        >
            {Array.from({ length: 5 }, (_, index) => (
                <span
                    key={index}
                    className={
                        index < rating
                            ? "text-warning-text icon-svg:w-4 icon-svg:h-4 icon-svg:fill-current"
                            : "text-text-secondary icon-svg:w-4 icon-svg:h-4"
                    }
                >
                    <StarIcon />
                </span>
            ))}
        </span>
    );
}
