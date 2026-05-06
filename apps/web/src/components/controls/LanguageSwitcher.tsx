import { SegmentedControl } from "@waymate/ui";

export type Language = "en" | "sk" | "cz";

export type LanguageSwitcherProps = {
    value: Language;
    onChange: (value: Language) => void;
};

const languageOptions = [
    { label: "EN", value: "en" },
    { label: "SK", value: "sk" },
    { label: "CZ", value: "cz" },
] as const;

export function LanguageSwitcher({ value, onChange }: LanguageSwitcherProps) {
    return (
        <SegmentedControl
            value={value}
            onChange={(newValue) => onChange(newValue as Language)}
            options={[...languageOptions]}
        />
    );
}
