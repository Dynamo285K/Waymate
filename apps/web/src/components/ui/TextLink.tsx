import type { ReactNode } from "react";

export type TextLinkProps = {
    children: ReactNode;
    href?: string;
    onClick?: () => void;
    variant?: "primary" | "muted";
    className?: string;
};

const base =
    "bg-transparent border-0 p-0 text-sm font-semibold cursor-pointer no-underline transition-colors duration-200";

const variants = {
    primary: "text-primary hover:text-primary-hover hover:underline",
    muted: "text-text-secondary hover:text-text-primary hover:underline",
};

export function TextLink({
    children,
    href,
    onClick,
    variant = "primary",
    className: extraClass,
}: TextLinkProps) {
    const cls = [base, variants[variant], extraClass].filter(Boolean).join(" ");

    if (href) {
        return (
            <a
                href={href}
                className={cls}
            >
                {children}
            </a>
        );
    }

    return (
        <button
            type="button"
            className={cls}
            onClick={onClick}
        >
            {children}
        </button>
    );
}
