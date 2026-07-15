import { StarIcon } from "@/components/ui/icons/StarIcon";

export type RatingSummaryCardProps = {
    rating: number;
    totalRatings: number;
    totalRatingsLabel?: string;
};

export function RatingSummaryCard({
    rating,
    totalRatings,
    totalRatingsLabel,
}: RatingSummaryCardProps) {
    return (
        <div className="flex justify-between items-center py-5 px-6 bg-card border border-border rounded-2xl">
            <div className="flex items-center gap-2 [&_svg]:w-8 [&_svg]:h-8 [&_svg]:text-dark-yellow [&_svg]:fill-dark-yellow">
                <span className="text-title font-bold text-text-primary">
                    {rating}
                </span>
                <StarIcon />
            </div>
            <div className="flex flex-col items-end gap-0.5">
                <span className="text-sm text-text-secondary">
                    {totalRatingsLabel ?? "Total Ratings"}
                </span>
                <span className="text-panel-title font-bold text-text-primary">
                    {totalRatings}
                </span>
            </div>
        </div>
    );
}
