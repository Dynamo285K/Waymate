import type { ReactNode } from "react";

export type NavButtonProps = {
    children: ReactNode;
    icon?: ReactNode;
    active?: boolean;
    onClick?: () => void;
};

export function NavButton({
    children,
    icon,
    active = false,
    onClick,
}: NavButtonProps) {
    return (
        <button
            type="button"
            className={`nav-button inline-flex items-center gap-2 whitespace-nowrap py-2.5 px-4 rounded-full border-0 text-sm font-medium cursor-pointer transition-all duration-200 shadow-button hover:-translate-y-px ${
                active
                    ? "bg-primary text-secondary shadow-primary"
                    : "bg-card text-text-primary hover:bg-border"
            }`}
            onClick={onClick}
        >
            {icon && (
                <span className="flex items-center [&_svg]:w-4 [&_svg]:h-4">
                    {icon}
                </span>
            )}
            <span className="leading-none">{children}</span>
        </button>
    );
}
