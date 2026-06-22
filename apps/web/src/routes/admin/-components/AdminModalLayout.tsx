import type { FormEventHandler, ReactNode } from "react";
import { CloseIcon, IconButton } from "@waymate/ui";

type AdminModalBodyProps = {
    children: ReactNode;
    size?: "md" | "lg";
    as?: "div" | "form";
    onSubmit?: FormEventHandler<HTMLFormElement>;
};

type AdminModalHeaderProps = {
    title: ReactNode;
    onClose: () => void;
};

export const adminLabelClass =
    "text-xs font-bold text-text-secondary tracking-wider mb-1 block";

export const adminPanelClass =
    "min-w-0 overflow-hidden border border-border rounded-xl p-4";

export const adminTextPanelClass =
    "text-sm text-text-primary whitespace-pre-wrap break-words border border-border rounded-xl p-3 bg-background";

export const adminActionButtonClass = "w-full sm:w-auto justify-center";

export function AdminModalBody({
    children,
    size = "md",
    as = "div",
    onSubmit,
}: AdminModalBodyProps) {
    const maxWidthClass = size === "lg" ? "max-w-3xl" : "max-w-2xl";
    const className = `w-full min-w-0 ${maxWidthClass} p-5 sm:p-8 max-h-modal-body overflow-y-auto`;

    if (as === "form") {
        return (
            <form
                onSubmit={onSubmit}
                className={className}
            >
                {children}
            </form>
        );
    }

    return <div className={className}>{children}</div>;
}

export function AdminModalHeader({ title, onClose }: AdminModalHeaderProps) {
    return (
        <div className="flex items-start justify-between gap-4 mb-6">
            <h2 className="text-xl font-bold text-text-primary min-w-0">
                {title}
            </h2>
            <IconButton
                ariaLabel="Close"
                icon={<CloseIcon />}
                variant="ghost"
                onClick={onClose}
            />
        </div>
    );
}

export function AdminModalActions({ children }: { children: ReactNode }) {
    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
            {children}
        </div>
    );
}
