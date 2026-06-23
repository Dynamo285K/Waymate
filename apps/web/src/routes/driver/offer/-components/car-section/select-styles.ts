// Shared Radix Select styling for the car-section dropdowns (saved-car picker
// and the manual brand/model selects). Kept in one place so both views stay
// visually identical.

export const selectTrigger =
    "w-full flex items-center justify-between gap-2 py-3 px-4 rounded-xl border border-border bg-input text-text-primary text-sm font-medium cursor-pointer transition-colors duration-150 outline-none hover:border-primary focus-visible:border-primary radix-placeholder:text-text-secondary radix-disabled:cursor-not-allowed radix-disabled:opacity-60";

export const selectContent =
    "w-radix-select-trigger overflow-hidden rounded-xl border border-border bg-card p-1 shadow-dropdown-strong z-select-content";

export const selectViewport =
    "max-h-radix-select-list overflow-y-auto overscroll-contain";

export const selectItem =
    "w-full py-2 px-3 rounded-lg bg-transparent text-text-primary text-sm font-medium cursor-pointer transition-colors duration-100 outline-none select-none flex items-center hover:bg-background radix-highlighted:bg-background radix-highlighted:outline-none radix-checked:bg-primary-tint radix-checked:text-primary";

export const selectAdornmentClass =
    "text-text-secondary inline-flex items-center shrink-0";
