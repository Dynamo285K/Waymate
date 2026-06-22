import * as Select from "@radix-ui/react-select";
import { ChevronDownIcon } from "@waymate/ui";

export type FilterSelectOption<T extends string> = {
    value: T;
    label: string;
};

type FilterSelectProps<T extends string> = {
    value: T;
    onValueChange: (value: T) => void;
    options: ReadonlyArray<FilterSelectOption<T>>;
    ariaLabel?: string;
};

// Styled wrapper around Radix Select used by the admin filter bars. Replaces
// raw <select> (forbidden by the no-restricted-syntax lint rule) with a
// keyboard-accessible, theme-aware dropdown. Radix forbids empty-string item
// values, so callers map their "all"/null option to a non-empty sentinel.
export function FilterSelect<T extends string>({
    value,
    onValueChange,
    options,
    ariaLabel,
}: FilterSelectProps<T>) {
    return (
        <Select.Root
            value={value}
            onValueChange={(next) => onValueChange(next as T)}
        >
            <Select.Trigger
                aria-label={ariaLabel}
                className="flex items-center justify-between gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm text-text-primary cursor-pointer outline-none focus:border-primary"
            >
                <Select.Value />
                <Select.Icon className="text-text-secondary shrink-0">
                    <ChevronDownIcon />
                </Select.Icon>
            </Select.Trigger>
            <Select.Portal>
                <Select.Content
                    className="z-1100 min-w-(--radix-select-trigger-width) rounded-xl border border-border bg-card p-1 shadow-lg"
                    position="popper"
                    sideOffset={4}
                >
                    <Select.Viewport>
                        {options.map((option) => (
                            <Select.Item
                                key={option.value}
                                value={option.value}
                                className="flex items-center px-3 py-2 text-sm rounded-lg text-text-primary cursor-pointer outline-none data-highlighted:bg-background data-[state=checked]:text-primary"
                            >
                                <Select.ItemText>
                                    {option.label}
                                </Select.ItemText>
                            </Select.Item>
                        ))}
                    </Select.Viewport>
                </Select.Content>
            </Select.Portal>
        </Select.Root>
    );
}
