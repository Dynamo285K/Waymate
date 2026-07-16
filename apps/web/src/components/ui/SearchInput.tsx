import type { ChangeEvent } from "react";

export type SearchInputProps = {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
};

export function SearchInput({
    value,
    onChange,
    placeholder = "Search…",
}: SearchInputProps) {
    return (
        <div className="flex items-center gap-2 border border-border rounded-xl py-2 px-3 bg-card transition-[border-color] duration-200 focus-within:border-primary">
            <svg
                className="text-text-secondary shrink-0"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <circle
                    cx="11"
                    cy="11"
                    r="8"
                />
                <path d="m21 21-4.35-4.35" />
            </svg>
            <input
                className="flex-1 border-0 outline-none bg-transparent text-sm text-text-primary placeholder:text-text-secondary"
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    onChange(e.target.value)
                }
            />
        </div>
    );
}
