import type { ReactNode } from "react";

export type FieldLabelProps = {
    label: string;
    icon?: ReactNode;
};

export function FieldLabel({ label, icon }: FieldLabelProps) {
    return (
        <span className="inline-flex items-center gap-2.5">
            {icon && (
                <span className="inline-flex items-center justify-center text-text-primary [&_svg]:w-5 [&_svg]:h-5">
                    {icon}
                </span>
            )}
            <span className="text-base leading-6 font-medium text-text-primary">
                {label}
            </span>
        </span>
    );
}
