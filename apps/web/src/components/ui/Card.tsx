import type { ReactNode } from "react";

export type CardProps = {
    children: ReactNode;
};

export function Card({ children }: CardProps) {
    return (
        <div className="bg-card rounded-2xl p-8 shadow-dropdown-strong w-full max-w-140">
            {children}
        </div>
    );
}
