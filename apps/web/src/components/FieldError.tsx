import type { ReactNode } from "react";

type FieldErrorProps = {
    /** Error text. The component renders nothing when this is empty. */
    children?: ReactNode;
    /** Layout-only classes (e.g. margin) — spacing depends on the form. */
    className?: string;
};

// One definition of the inline form-error look — colour, weight and size — so
// every form renders validation messages identically. Forms pass only spacing
// via `className`, since that depends on the surrounding field layout. Rendered
// as a block <span> so it is valid both standalone and inside a <label>.
export function FieldError({ children, className }: FieldErrorProps) {
    if (!children) return null;
    return (
        <span
            className={`block text-sm font-semibold text-(--color-danger-text)${
                className ? ` ${className}` : ""
            }`}
        >
            {children}
        </span>
    );
}
