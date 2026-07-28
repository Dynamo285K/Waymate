import { Controller } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { ColorSwatchPicker } from "@/components/shared/ColorSwatchPicker";
import { FieldError } from "../../../../components/shared/FieldError";
import { labelClass } from "../-field-styles";
import type { CarFormControl } from "../-schema";

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
                    <ColorSwatchPicker
                        value={field.value}
                        onChange={field.onChange}
                        className="mt-3"
                    />
                )}
            />
            <FieldError className="mt-2">{error && t(error)}</FieldError>
        </div>
    );
}
