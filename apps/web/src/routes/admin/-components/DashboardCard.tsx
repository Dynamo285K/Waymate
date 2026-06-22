import type { ReactNode } from "react";

export function DashboardCard({
    children,
    className = "",
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <div
            className={`bg-card rounded-2xl border border-border p-6 ${className}`}
        >
            {children}
        </div>
    );
}
