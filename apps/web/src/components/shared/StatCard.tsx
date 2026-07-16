import { type ReactNode } from "react";

export type StatCardProps = {
    icon: ReactNode;
    value: string;
    label: string;
};

export function StatCard({ icon, value, label }: StatCardProps) {
    return (
        <div className="flex items-center gap-4 py-5 px-6 bg-card border border-border rounded-2xl">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl shrink-0 [&_svg]:w-7 [&_svg]:h-7">
                {icon}
            </div>
            <div className="flex flex-col gap-0.5">
                <span className="text-subtitle font-bold text-text-primary">
                    {value}
                </span>
                <span className="text-sm text-text-secondary">{label}</span>
            </div>
        </div>
    );
}
