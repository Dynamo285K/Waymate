import { useState } from "react";

export type RatingStarsProps = {
    value: number;
    max?: number;
    size?: "sm" | "md" | "lg";
    interactive?: boolean;
    onChange?: (value: number) => void;
};

const starSizes = {
    sm: "w-4 h-4",
    md: "w-[22px] h-[22px]",
    lg: "w-7 h-7",
};

const gaps = {
    sm: "gap-1",
    md: "gap-1.5",
    lg: "gap-2",
};

function StarSvg({
    filled,
    sizeClass,
}: {
    filled: boolean;
    sizeClass: string;
}) {
    return (
        <svg
            viewBox="0 0 24 24"
            className={`block fill-current drop-shadow-star ${sizeClass} ${
                filled ? "text-dark-yellow" : "text-border"
            }`}
            aria-hidden="true"
        >
            <path d="M12 2.5l2.93 5.94 6.55.95-4.74 4.62 1.12 6.52L12 17.46 6.14 20.53l1.12-6.52L2.52 9.39l6.55-.95L12 2.5z" />
        </svg>
    );
}

export function RatingStars({
    value,
    max = 5,
    size = "md",
    interactive = false,
    onChange,
}: RatingStarsProps) {
    const [hoverValue, setHoverValue] = useState(0);

    const normalizedValue = Math.max(0, Math.min(value, max));
    const displayedValue = interactive
        ? hoverValue || normalizedValue
        : normalizedValue;

    return (
        <div
            className={`inline-flex items-center ${gaps[size]}`}
            aria-label={`Rating: ${normalizedValue} out of ${max}`}
        >
            {Array.from({ length: max }, (_, index) => {
                const starValue = index + 1;
                const isFilled = starValue <= displayedValue;

                if (!interactive) {
                    return (
                        <StarSvg
                            key={index}
                            filled={isFilled}
                            sizeClass={starSizes[size]}
                        />
                    );
                }

                return (
                    <button
                        key={index}
                        type="button"
                        className="inline-flex items-center justify-center p-0 border-0 bg-transparent cursor-pointer group focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-4 focus-visible:rounded-[10px]"
                        onClick={() => onChange?.(starValue)}
                        onMouseEnter={() => setHoverValue(starValue)}
                        onMouseLeave={() => setHoverValue(0)}
                        aria-label={`Rate ${starValue} star${starValue > 1 ? "s" : ""}`}
                    >
                        <span className="transition-transform duration-150 group-hover:scale-[1.08]">
                            <StarSvg
                                filled={isFilled}
                                sizeClass={starSizes[size]}
                            />
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
