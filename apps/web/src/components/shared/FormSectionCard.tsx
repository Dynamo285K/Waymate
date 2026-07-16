import type { ReactNode } from "react";

export type FormSectionCardProps = {
    title: string;
    headerRight?: ReactNode;
    children: ReactNode;
};

export function FormSectionCard({
    title,
    headerRight,
    children,
}: FormSectionCardProps) {
    return (
        <div className="w-full bg-card border border-border rounded-2xl p-6 shadow-card flex flex-col gap-5">
            <div className="flex items-center justify-between gap-4">
                <h3 className="m-0 text-subtitle leading-7.5 font-bold text-text-primary">
                    {title}
                </h3>
                {headerRight && <div className="shrink-0">{headerRight}</div>}
            </div>

            <div className="flex flex-col gap-4">{children}</div>
        </div>
    );
}
