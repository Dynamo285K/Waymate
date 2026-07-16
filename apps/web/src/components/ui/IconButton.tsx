import type { ReactNode } from "react";

export type IconButtonProps = {
    icon: ReactNode;
    ariaLabel: string;
    onClick?: () => void;
    variant?: "default" | "ghost" | "sun" | "moon";
    disabled?: boolean;
};

const variants: Record<"default" | "ghost" | "sun" | "moon", string> = {
    default: "bg-card text-text-primary shadow-button",
    ghost: "bg-transparent text-text-primary",
    sun: "bg-card text-yellow shadow-icon-strong",
    moon: "bg-background text-text-primary shadow-icon",
};

export function IconButton({
    icon,
    ariaLabel,
    onClick,
    variant = "default",
    disabled = false,
}: IconButtonProps) {
    return (
        <button
            type="button"
            aria-label={ariaLabel}
            className={`inline-flex items-center justify-center w-11 h-11 border-0 rounded-full cursor-pointer transition-all duration-200 hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:w-5 [&_svg]:h-5 ${variants[variant]}`}
            onClick={onClick}
            disabled={disabled}
        >
            {icon}
        </button>
    );
}
