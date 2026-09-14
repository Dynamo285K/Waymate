import { Link } from "@tanstack/react-router";
import { StarIcon } from "@/components/ui/icons/StarIcon";

export type RatingLinkProps = {
    userId: string;
    name: string;
    rating: number;
    to: "/passenger/ratings" | "/driver/ratings";
    textClassName?: string;
    className?: string;
};

// Links a rating badge (star + score) shown for the counterpart in a ride
// card to that person's reviews page. Carries their name along in the URL
// so the ratings page can show whose reviews are being viewed without an
// extra fetch.
export function RatingLink({
    userId,
    name,
    rating,
    to,
    textClassName = "text-caption text-text-secondary",
    className: extraClassName,
}: RatingLinkProps) {
    const className = [
        "flex items-center gap-1 icon-svg:w-3.5 icon-svg:h-3.5 icon-svg:text-dark-yellow icon-svg:fill-dark-yellow icon-svg:shrink-0",
        extraClassName,
    ]
        .filter(Boolean)
        .join(" ");

    return (
        <Link
            to={to}
            search={{ userId, name }}
            className={className}
            onClick={(event) => event.stopPropagation()}
        >
            <StarIcon />
            <span
                className={`${textClassName} hover:text-text-primary hover:underline`}
            >
                {rating.toFixed(1)}
            </span>
        </Link>
    );
}
