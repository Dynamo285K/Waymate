import { CarIcon } from "@/components/ui/icons/CarIcon";
import { TrashIcon } from "@/components/ui/icons/TrashIcon";

export type CarCardProps = {
    model: string;
    onClick?: () => void;
    onDelete?: () => void;
};

function formatModel(model: string) {
    if (!model) return "";
    const parts = model.split(" ");
    if (parts.length === 1) return parts[0].toUpperCase();
    const brand = parts[0].toUpperCase();
    const rest = parts
        .slice(1)
        .map(
            (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        )
        .join(" ");
    return `${brand} ${rest}`;
}

export function CarCard({ model, onClick, onDelete }: CarCardProps) {
    return (
        <div
            className={`w-full min-h-20 py-4 px-[18px] border-0 rounded-2xl bg-card shadow-card flex items-center gap-4 box-border transition-[transform,box-shadow] duration-200 ${
                onClick
                    ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-card-hover"
                    : "cursor-default"
            }`}
            onClick={onClick}
            role={onClick ? "button" : undefined}
            tabIndex={onClick ? 0 : undefined}
        >
            <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-dark-green-soft text-dark-green [&_svg]:w-[26px] [&_svg]:h-[26px]">
                <CarIcon />
            </div>

            <span className="flex-1 text-xl leading-7 font-bold text-text-primary">
                {formatModel(model)}
            </span>

            {onDelete && (
                <button
                    type="button"
                    className="flex items-center justify-center w-9 h-9 rounded-lg border-0 bg-transparent text-text-secondary cursor-pointer transition-[background,color] duration-150 shrink-0 hover:bg-danger-bg hover:text-red"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                    }}
                >
                    <TrashIcon />
                </button>
            )}
        </div>
    );
}
