import { forwardRef } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
    label?: string;
    leftIcon?: ReactNode;
    rightIcon?: ReactNode;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
    { label, leftIcon, rightIcon, className, type = "text", ...props },
    ref
) {
    return (
        <div className="flex flex-col gap-2 w-full">
            {label && (
                <label className="text-sm font-bold text-text-primary">
                    {label}
                </label>
            )}

            <div className="group flex items-center gap-2.5 border border-border rounded-xl px-3 bg-input transition-[border-color,box-shadow] duration-200 focus-within:border-primary focus-within:shadow-focus has-[input:disabled]:bg-background has-[input:disabled]:cursor-not-allowed">
                {leftIcon && (
                    <span className="flex items-center text-text-secondary [&_svg]:w-4.5 [&_svg]:h-4.5 group-focus-within:text-primary">
                        {leftIcon}
                    </span>
                )}

                <input
                    ref={ref}
                    className={[
                        "flex-1 py-3 border-0 outline-none text-sm bg-transparent text-text-primary! placeholder:text-text-secondary",
                        className,
                    ]
                        .filter(Boolean)
                        .join(" ")}
                    type={type}
                    {...props}
                />

                {rightIcon && (
                    <span className="flex items-center text-text-secondary [&_svg]:w-4.5 [&_svg]:h-4.5">
                        {rightIcon}
                    </span>
                )}
            </div>
        </div>
    );
});
