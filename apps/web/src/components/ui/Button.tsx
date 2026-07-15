import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant =
    | "primary"
    | "secondary"
    | "outline"
    | "outlineSuccess"
    | "black"
    | "red"
    | "ghost"
    | "unstyled";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    children: ReactNode;
    variant?: Variant;
    fullWidth?: boolean;
    leftIcon?: ReactNode;
    rightIcon?: ReactNode;
};

const base =
    "inline-flex items-center justify-center gap-2 text-sm font-semibold cursor-pointer transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97]";

const variants: Record<Variant, string> = {
    primary: "py-3 px-4 rounded-xl bg-primary text-card hover:bg-primary-hover",
    secondary:
        "py-3 px-4 rounded-xl border border-border bg-secondary text-text-secondary hover:bg-border",
    red: "py-3 px-4 rounded-xl border border-red bg-secondary text-red hover:bg-border",
    black: "py-3 px-4 rounded-xl bg-button text-white hover:bg-button-hover",
    outline:
        "py-3 px-4 rounded-xl border border-border bg-transparent text-text-secondary hover:bg-border",
    ghost: "py-3 px-4 rounded-xl bg-transparent text-text-secondary hover:bg-border",
    outlineSuccess:
        "py-2.5 px-5 rounded-full border-[1.5px] border-primary bg-transparent text-primary hover:bg-primary-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
    unstyled: "",
};

export function Button({
    children,
    variant = "primary",
    fullWidth = false,
    leftIcon,
    rightIcon,
    className = "",
    type = "button",
    ...props
}: ButtonProps) {
    return (
        <button
            type={type}
            className={
                variant === "unstyled"
                    ? className
                    : `${base} ${variants[variant]} ${fullWidth ? "w-full" : ""} ${className}`.trim()
            }
            {...props}
        >
            {leftIcon && (
                <span className="inline-flex items-center shrink-0">
                    {leftIcon}
                </span>
            )}
            {children}
            {rightIcon && (
                <span className="inline-flex items-center shrink-0">
                    {rightIcon}
                </span>
            )}
        </button>
    );
}
