import type { ReactNode } from "react";

export function StepVisual({ children }: { children: ReactNode }) {
    return (
        <div className="w-16 h-16 rounded-full bg-success-bg flex items-center justify-center mx-auto mb-5 text-success-text">
            {children}
        </div>
    );
}
