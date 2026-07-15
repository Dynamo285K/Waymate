import type { ChangeEvent } from "react";

export type TextareaProps = {
    label?: string;
    placeholder?: string;
    value?: string;
    disabled?: boolean;
    name?: string;
    rows?: number;
    maxLength?: number;
    onChange?: (event: ChangeEvent<HTMLTextAreaElement>) => void;
};

export function Textarea({
    label,
    placeholder,
    value,
    disabled = false,
    name,
    rows = 4,
    maxLength,
    onChange,
}: TextareaProps) {
    return (
        <div className="flex flex-col gap-2 w-full">
            {label && (
                <label className="text-sm font-bold text-text-primary">
                    {label}
                </label>
            )}
            <textarea
                className="w-full p-3 border border-border rounded-xl bg-input text-text-primary text-sm leading-6 resize-y outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-text-secondary focus:border-primary focus:shadow-focus disabled:bg-background disabled:cursor-not-allowed box-border"
                name={name}
                placeholder={placeholder}
                value={value}
                disabled={disabled}
                rows={rows}
                maxLength={maxLength}
                onChange={onChange}
            />
        </div>
    );
}
