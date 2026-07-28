import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/Button";
import { COLORS, type CarColor } from "@/lib/car-colors";

type ColorSwatchPickerProps = {
    value: CarColor | null | undefined;
    onChange: (value: CarColor) => void;
    className?: string;
};

// Swatch-grid color picker shared by the Add Car form and the Ride Creation
// manual-car entry, so both offer the same set of colors with the same look.
export function ColorSwatchPicker({
    value,
    onChange,
    className,
}: ColorSwatchPickerProps) {
    const { t } = useTranslation();

    return (
        <div
            className={`flex gap-3 flex-wrap${className ? ` ${className}` : ""}`}
        >
            {COLORS.map((c) => (
                <Button
                    key={c.value}
                    type="button"
                    variant="unstyled"
                    onClick={() => onChange(c.value)}
                    className="flex flex-col items-center gap-1"
                >
                    <span
                        className={`w-10 h-10 rounded-full border-2 border-solid outline-1 outline-offset-2 outline-border transition-all ${value === c.value ? "ring-2 ring-offset-2 ring-primary scale-110" : ""}`}
                        style={{
                            backgroundColor: c.hex,
                            borderColor: c.border,
                        }}
                    />
                    <span className="text-xs text-text-secondary">
                        {t(`carColor.${c.value}`)}
                    </span>
                </Button>
            ))}
        </div>
    );
}
