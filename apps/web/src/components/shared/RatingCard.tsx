import { Avatar } from "@/components/ui/Avatar";
import { RatingStars } from "@/components/ui/RatingStars";

export type RatingCardProps = {
    name: string;
    from: string;
    to: string;
    rating: number;
    review: string;
};

export function RatingCard({
    name,
    from,
    to,
    rating,
    review,
}: RatingCardProps) {
    return (
        <div className="flex justify-between items-center gap-6 py-5 px-6 bg-card border border-border rounded-2xl max-600:flex-col max-600:items-stretch max-600:gap-3 max-600:p-4">
            <div className="flex items-start gap-4 min-w-0 flex-1">
                <Avatar
                    name={name}
                    size="lg"
                />
                <div className="flex flex-col gap-1">
                    <span className="text-base font-semibold text-text-primary">
                        {name}
                    </span>
                    <span className="text-sm text-text-secondary">
                        {from} → {to}
                    </span>
                    <span className="text-sm text-text-primary mt-1">
                        {review}
                    </span>
                </div>
            </div>
            <div className="shrink-0 max-600:self-end">
                <RatingStars
                    value={rating}
                    size="md"
                    interactive={false}
                />
            </div>
        </div>
    );
}
