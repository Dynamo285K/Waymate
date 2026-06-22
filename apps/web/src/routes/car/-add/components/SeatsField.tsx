import { Controller } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Button } from "@waymate/ui";
import { FieldError } from "../../../../components/shared/FieldError";
import { labelClass } from "../field-styles";
import type { CarFormControl } from "../schema";

const SEAT_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8];

type SeatsFieldProps = {
    control: CarFormControl;
    error?: string;
};

export function SeatsField({ control, error }: SeatsFieldProps) {
    const { t } = useTranslation();

    return (
        <div className="p-6 border-b border-(--color-border)">
            <label className={labelClass}>
                {t("addCar.seats")}{" "}
                <span className="text-(--color-danger-text)">*</span>
                <span className="font-normal text-(--color-text-secondary) ml-2">
                    {t("addCar.excludingDriver")}
                </span>
            </label>
            <Controller
                control={control}
                name="seats"
                render={({ field }) => (
                    <div className="flex gap-2 mt-3 flex-wrap">
                        {SEAT_OPTIONS.map((n) => (
                            <Button
                                key={n}
                                type="button"
                                variant="unstyled"
                                onClick={() => field.onChange(n)}
                                className={`flex items-center justify-center w-12 h-12 rounded-xl border-2 font-semibold text-sm transition-all cursor-pointer ${
                                    field.value === n
                                        ? "border-(--color-primary) bg-(--color-primary)/10 text-(--color-primary)"
                                        : "border-(--color-border) bg-(--color-card) text-(--color-text-primary) hover:border-(--color-primary)"
                                }`}
                            >
                                {n}
                            </Button>
                        ))}
                    </div>
                )}
            />
            <FieldError className="mt-2">{error && t(error)}</FieldError>
        </div>
    );
}
