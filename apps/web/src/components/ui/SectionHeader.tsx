import type { ReactNode } from "react";

export type SectionHeaderProps = {
    title: string;
    action?: ReactNode;
    className?: string;
};

export function SectionHeader({
    title,
    action,
    className = "",
}: SectionHeaderProps) {
    return (
        <div
            className={`flex items-center justify-between gap-4 w-full ${className}`.trim()}
        >
            <h2 className="m-0 text-text-primary text-2xl font-semibold leading-[1.3]">
                {title}
            </h2>
            {action && (
                <div className="flex items-center shrink-0">{action}</div>
            )}
        </div>
    );
}
