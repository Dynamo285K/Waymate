import * as Select from "@radix-ui/react-select";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { FieldLabel, Input, CarIcon, ChevronDownIcon } from "@waymate/ui";
import { PLATE_MAX_LENGTH, PLATE_MIN_LENGTH } from "@repo/shared/validation";
import type { OfferRideFormInput } from "../schema";
import {
    selectTrigger,
    selectContent,
    selectViewport,
    selectItem,
    selectAdornmentClass,
} from "./select-styles";

export type ManualCarFieldsProps = {
    hasSavedCars: boolean;
    brandOptions: string[];
    brandLoading: boolean;
    modelOptions: string[];
    modelLoading: boolean;
};

/** Manual-car branch: brand/model selects + plate input, driven by form state. */
export function ManualCarFields({
    hasSavedCars,
    brandOptions,
    brandLoading,
    modelOptions,
    modelLoading,
}: ManualCarFieldsProps) {
    const { t } = useTranslation();
    const { watch, setValue, clearErrors, formState } =
        useFormContext<OfferRideFormInput>();
    const { errors, isSubmitted } = formState;

    const manualBrand = watch("manualBrand");
    const manualModel = watch("manualModel");
    const manualPlate = watch("manualPlate");

    const handleBrandChange = (value: string) => {
        setValue("manualBrand", value, { shouldValidate: isSubmitted });
        setValue("manualModel", "", { shouldValidate: isSubmitted });
        clearErrors(["manualBrand", "manualModel"]);
    };

    const handleModelChange = (value: string) => {
        setValue("manualModel", value, { shouldValidate: isSubmitted });
        clearErrors("manualModel");
    };

    const handlePlateChange = (value: string) => {
        setValue("manualPlate", value.toUpperCase(), {
            shouldValidate: isSubmitted,
        });
        clearErrors("manualPlate");
    };

    return (
        <div className="flex flex-col gap-5">
            {!hasSavedCars && (
                <p className="m-0 py-3 px-4 rounded-xl border border-warning-border bg-warning-bg text-sm text-warning-text">
                    {t("offerRide.noCars")}
                </p>
            )}
            <div className="grid grid-cols-2 gap-5 max-md:grid-cols-1">
                <div className="flex flex-col gap-2.5">
                    <FieldLabel
                        label={t("offerRide.carBrand")}
                        icon={<CarIcon />}
                    />
                    <Select.Root
                        value={manualBrand || undefined}
                        onValueChange={handleBrandChange}
                        disabled={brandLoading}
                    >
                        <Select.Trigger className={selectTrigger}>
                            <Select.Value
                                placeholder={
                                    brandLoading
                                        ? t("offerRide.loadingCarBrands")
                                        : t("offerRide.selectCarBrand")
                                }
                            />
                            <Select.Icon className={selectAdornmentClass}>
                                <ChevronDownIcon />
                            </Select.Icon>
                        </Select.Trigger>
                        <Select.Portal>
                            <Select.Content
                                className={selectContent}
                                position="popper"
                                sideOffset={8}
                            >
                                <Select.Viewport className={selectViewport}>
                                    {brandOptions.map((brand) => (
                                        <Select.Item
                                            key={brand}
                                            value={brand}
                                            className={selectItem}
                                        >
                                            <Select.ItemText>
                                                {brand}
                                            </Select.ItemText>
                                        </Select.Item>
                                    ))}
                                </Select.Viewport>
                            </Select.Content>
                        </Select.Portal>
                    </Select.Root>
                    {errors.manualBrand?.message && (
                        <p className="-mt-0.5 text-danger-text text-xs font-semibold">
                            {t(errors.manualBrand.message)}
                        </p>
                    )}
                </div>
                <div className="flex flex-col gap-2.5">
                    <FieldLabel label={t("offerRide.carModel")} />
                    <Select.Root
                        value={manualModel || undefined}
                        onValueChange={handleModelChange}
                        disabled={modelLoading || !manualBrand}
                    >
                        <Select.Trigger className={selectTrigger}>
                            <Select.Value
                                placeholder={
                                    modelLoading
                                        ? t("offerRide.loadingCarModels")
                                        : t("offerRide.selectCarModel")
                                }
                            />
                            <Select.Icon className={selectAdornmentClass}>
                                <ChevronDownIcon />
                            </Select.Icon>
                        </Select.Trigger>
                        <Select.Portal>
                            <Select.Content
                                className={selectContent}
                                position="popper"
                                sideOffset={8}
                            >
                                <Select.Viewport className={selectViewport}>
                                    {modelOptions.map((model) => (
                                        <Select.Item
                                            key={model}
                                            value={model}
                                            className={selectItem}
                                        >
                                            <Select.ItemText>
                                                {model}
                                            </Select.ItemText>
                                        </Select.Item>
                                    ))}
                                </Select.Viewport>
                            </Select.Content>
                        </Select.Portal>
                    </Select.Root>
                    {errors.manualModel?.message && (
                        <p className="-mt-0.5 text-danger-text text-xs font-semibold">
                            {t(errors.manualModel.message)}
                        </p>
                    )}
                </div>
                <div className="col-span-full flex flex-col gap-2.5 max-md:col-span-1">
                    <FieldLabel label={t("offerRide.licensePlate")} />
                    <Input
                        value={manualPlate}
                        onChange={(e) => handlePlateChange(e.target.value)}
                        placeholder={t("offerRide.platePlaceholder")}
                    />
                    {errors.manualPlate?.message && (
                        <p className="-mt-0.5 text-danger-text text-xs font-semibold">
                            {t(errors.manualPlate.message, {
                                min: PLATE_MIN_LENGTH,
                                max: PLATE_MAX_LENGTH,
                            })}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
