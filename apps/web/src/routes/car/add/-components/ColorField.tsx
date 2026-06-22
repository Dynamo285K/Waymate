import type { CSSProperties } from "react";
import { Controller } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Button } from "@waymate/ui";
import { FieldError } from "../../../../components/shared/FieldError";
import { labelClass } from "../-field-styles";
import { COLORS, type CarFormControl } from "../-schema";

type ColorFieldProps = {
    control: CarFormControl;
    error?: string;
};

export function ColorField({ control, error }: ColorFieldProps) {
    const { t } = useTranslation();

    return (
        <div className="p-6 border-b border-border">
            <label className={labelClass}>
                {t("addCar.color")} <span className="text-danger-text">*</span>
            </label>
            <Controller
                control={control}
                name="color"
                render={({ field }) => (
                    <div className="flex gap-3 mt-3 flex-wrap">
                        {COLORS.map((c) => (
                            <Button
                                key={c.value}
                                type="button"
                                variant="unstyled"
                                onClick={() => field.onChange(c.value)}
                                className="flex flex-col items-center gap-1"
                            >
                                <span
                                    className={`w-10 h-10 rounded-full border-[1.5px] border-solid bg-[var(--swatch-bg)] border-[color:var(--swatch-border)] transition-all ${field.value === c.value ? "ring-2 ring-offset-2 ring-primary scale-110" : ""}`}
                                    style={
                                        {
                                            "--swatch-bg": c.hex,
                                            "--swatch-border": c.border,
                                        } as CSSProperties
                                    }
                                />
                                <span className="text-xs text-text-secondary">
                                    {c.label}
                                </span>
                            </Button>
                        ))}
                    </div>
                )}
            />
            <FieldError className="mt-2">{error && t(error)}</FieldError>
        </div>
    );
}
