import { Controller } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Input } from "@waymate/ui";
import { FieldError } from "../../../../components/shared/FieldError";
import { PLATE_MAX_LENGTH, PLATE_MIN_LENGTH } from "@repo/shared/validation";
import { labelClass } from "../-field-styles";
import type { CarFormControl } from "../-schema";

type LicensePlateFieldProps = {
    control: CarFormControl;
    error?: string;
};

export function LicensePlateField({ control, error }: LicensePlateFieldProps) {
    const { t } = useTranslation();

    return (
        <div className="p-6 border-b border-border">
            <label className={labelClass}>
                {t("addCar.licensePlate")}{" "}
                <span className="text-danger-text">*</span>
            </label>
            <div className="flex gap-2 mt-1 items-center">
                {}
                <div className="shrink-0 w-16 h-12 rounded-xl bg-royal-blue flex flex-col items-center justify-center text-white text-xs font-bold">
                    <span className="text-yellow tracking-widest text-plate">
                        ***
                    </span>
                    <span className="text-badge mt-0.5">SK</span>
                </div>
                {}
                <Controller
                    control={control}
                    name="plate"
                    render={({ field }) => (
                        <Input
                            placeholder="BA123AB"
                            value={field.value}
                            onChange={(e) =>
                                field.onChange(e.target.value.toUpperCase())
                            }
                        />
                    )}
                />
            </div>
            <FieldError className="mt-2">
                {error &&
                    t(error, {
                        min: PLATE_MIN_LENGTH,
                        max: PLATE_MAX_LENGTH,
                    })}
            </FieldError>
        </div>
    );
}
