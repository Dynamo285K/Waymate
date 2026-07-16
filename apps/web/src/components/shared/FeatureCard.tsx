import { type ReactNode } from "react";

export type FeatureCardProps = {
    icon: ReactNode;
    title: string;
    description: string;
};

export function FeatureCard({ icon, title, description }: FeatureCardProps) {
    return (
        <div className="flex flex-col gap-2 p-5 bg-card border border-border rounded-2xl">
            <div className="flex items-center justify-center w-11 h-11 rounded-xl shrink-0 mb-1 [&_svg]:w-6 [&_svg]:h-6">
                {icon}
            </div>
            <span className="text-control font-semibold text-text-primary">
                {title}
            </span>
            <span className="text-caption text-text-secondary leading-6">
                {description}
            </span>
        </div>
    );
}
