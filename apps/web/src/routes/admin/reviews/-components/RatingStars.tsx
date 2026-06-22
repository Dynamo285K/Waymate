export function RatingStars({ rating }: { rating: number }) {
    const filled = "★".repeat(rating);
    const empty = "☆".repeat(Math.max(0, 5 - rating));
    return (
        <span
            className="text-warning-text font-semibold"
            aria-label={`${rating} / 5`}
        >
            {filled}
            <span className="text-text-secondary">{empty}</span>
        </span>
    );
}
