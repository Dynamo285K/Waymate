import * as Select from "@radix-ui/react-select";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
    FieldLabel,
    FormSectionCard,
    Input,
    SegmentedControl,
    CarIcon,
    ChevronDownIcon,
} from "@waymate/ui";
import { PLATE_MAX_LENGTH, PLATE_MIN_LENGTH } from "@repo/shared/validation";
import type { OfferRideFormInput } from "./schema";

export type OfferRideCar = {
    id: string;
    brand: string;
    model: string;
    plate: string;
};

export type CarSectionProps = {
    savedCars: OfferRideCar[];
    carMode: "saved" | "manual";
    onCarModeChange: (mode: "saved" | "manual") => void;
    selectedCarId: string;
    onSelectedCarChange: (id: string) => void;
    brandOptions: string[];
    brandLoading: boolean;
    modelOptions: string[];
    modelLoading: boolean;
};

const selectTrigger =
    "w-full flex items-center justify-between gap-2 py-3 px-4 rounded-xl border border-(--color-border) bg-(--color-input-bg) text-(--color-text-primary) text-sm font-medium cursor-pointer transition-[border-color] duration-150 outline-none hover:border-(--color-primary) focus-visible:border-(--color-primary) data-[disabled]:cursor-not-allowed data-[disabled]:opacity-60 [&[data-placeholder]>span:first-child]:text-(--color-text-secondary)";

const selectContent =
    "w-(--radix-select-trigger-width) overflow-hidden rounded-xl border border-(--color-border) bg-(--color-card) p-1 shadow-[0_8px_24px_rgba(0,0,0,0.12)] z-[1000]";

const selectViewport =
    "max-h-[min(320px,var(--radix-select-content-available-height))] overflow-y-auto overscroll-contain";

const selectItem =
    "w-full py-2 px-3 rounded-lg bg-transparent text-(--color-text-primary) text-sm font-medium cursor-pointer transition-[background] duration-100 outline-none select-none flex items-center hover:bg-(--color-bg) data-[highlighted]:bg-(--color-bg) data-[highlighted]:outline-none data-[state=checked]:bg-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] data-[state=checked]:text-(--color-primary)";

const selectIcon =
    "text-(--color-text-secondary) inline-flex items-center shrink-0";

export function CarSection({
    savedCars,
    carMode,
    onCarModeChange,
    selectedCarId,
    onSelectedCarChange,
    brandOptions,
    brandLoading,
    modelOptions,
    modelLoading,
}: CarSectionProps) {
    const { t } = useTranslation();
    const { watch, setValue, clearErrors, formState } =
        useFormContext<OfferRideFormInput>();
    const { errors, isSubmitted } = formState;

    const manualBrand = watch("manualBrand");
    const manualModel = watch("manualModel");
    const manualPlate = watch("manualPlate");

    const hasSavedCars = savedCars.length > 0;
    const selectedCar = savedCars.find((c) => c.id === selectedCarId);

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

    const carModeOptions = [
        { label: t("offerRide.myCars"), value: "saved" },
        { label: t("offerRide.manualCar"), value: "manual" },
    ];

    return (
        <FormSectionCard
            title={t("offerRide.carDetails")}
            headerRight={
                hasSavedCars ? (
                    <SegmentedControl
                        options={carModeOptions}
                        value={carMode}
                        onChange={(v) =>
                            onCarModeChange(v as "saved" | "manual")
                        }
                    />
                ) : undefined
            }
        >
            {hasSavedCars && carMode === "saved" ? (
                <div className="flex flex-col gap-5">
                    <div className="flex flex-col gap-2.5">
                        <FieldLabel
                            label={t("offerRide.chooseCar")}
                            icon={<CarIcon />}
                        />
                        <Select.Root
                            value={selectedCarId || undefined}
                            onValueChange={onSelectedCarChange}
                        >
                            <Select.Trigger className={selectTrigger}>
                                <Select.Value
                                    placeholder={t("offerRide.chooseCar")}
                                />
                                <Select.Icon className={selectIcon}>
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
                                        {savedCars.map((car) => (
                                            <Select.Item
                                                key={car.id}
                                                value={car.id}
                                                className={selectItem}
                                            >
                                                <Select.ItemText>
                                                    {car.brand} {car.model} –{" "}
                                                    {car.plate}
                                                </Select.ItemText>
                                            </Select.Item>
                                        ))}
                                    </Select.Viewport>
                                </Select.Content>
                            </Select.Portal>
                        </Select.Root>
                    </div>
                    <div className="grid grid-cols-2 gap-5 max-md:grid-cols-1">
                        <div className="py-3 px-4 rounded-xl border border-(--color-border) bg-(--color-bg)">
                            <p className="m-0 text-[11px] font-bold uppercase tracking-[0.06em] text-(--color-text-secondary)">
                                {t("offerRide.carBrand")}
                            </p>
                            <p className="mt-1 text-sm font-semibold text-(--color-text-primary)">
                                {selectedCar?.brand ?? "—"}
                            </p>
                        </div>
                        <div className="py-3 px-4 rounded-xl border border-(--color-border) bg-(--color-bg)">
                            <p className="m-0 text-[11px] font-bold uppercase tracking-[0.06em] text-(--color-text-secondary)">
                                {t("offerRide.carModel")}
                            </p>
                            <p className="mt-1 text-sm font-semibold text-(--color-text-primary)">
                                {selectedCar?.model ?? "—"}
                            </p>
                        </div>
                        <div className="col-span-full py-3 px-4 rounded-xl border border-(--color-border) bg-(--color-bg) max-md:col-span-1">
                            <p className="m-0 text-[11px] font-bold uppercase tracking-[0.06em] text-(--color-text-secondary)">
                                {t("offerRide.licensePlate")}
                            </p>
                            <p className="mt-1 text-sm font-semibold text-(--color-text-primary)">
                                {selectedCar?.plate ?? "—"}
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col gap-5">
                    {!hasSavedCars && (
                        <p className="m-0 py-3 px-4 rounded-xl border border-(--color-warning-border) bg-(--color-warning-bg) text-sm text-(--color-warning-text)">
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
                                                ? t(
                                                      "offerRide.loadingCarBrands"
                                                  )
                                                : t("offerRide.selectCarBrand")
                                        }
                                    />
                                    <Select.Icon className={selectIcon}>
                                        <ChevronDownIcon />
                                    </Select.Icon>
                                </Select.Trigger>
                                <Select.Portal>
                                    <Select.Content
                                        className={selectContent}
                                        position="popper"
                                        sideOffset={8}
                                    >
                                        <Select.Viewport
                                            className={selectViewport}
                                        >
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
                                <p className="-mt-0.5 text-(--color-danger-text) text-xs font-semibold">
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
                                                ? t(
                                                      "offerRide.loadingCarModels"
                                                  )
                                                : t("offerRide.selectCarModel")
                                        }
                                    />
                                    <Select.Icon className={selectIcon}>
                                        <ChevronDownIcon />
                                    </Select.Icon>
                                </Select.Trigger>
                                <Select.Portal>
                                    <Select.Content
                                        className={selectContent}
                                        position="popper"
                                        sideOffset={8}
                                    >
                                        <Select.Viewport
                                            className={selectViewport}
                                        >
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
                                <p className="-mt-0.5 text-(--color-danger-text) text-xs font-semibold">
                                    {t(errors.manualModel.message)}
                                </p>
                            )}
                        </div>
                        <div className="col-span-full flex flex-col gap-2.5 max-md:col-span-1">
                            <FieldLabel label={t("offerRide.licensePlate")} />
                            <Input
                                value={manualPlate}
                                onChange={(e) =>
                                    handlePlateChange(e.target.value)
                                }
                                placeholder={t("offerRide.platePlaceholder")}
                            />
                            {errors.manualPlate?.message && (
                                <p className="-mt-0.5 text-(--color-danger-text) text-xs font-semibold">
                                    {t(errors.manualPlate.message, {
                                        min: PLATE_MIN_LENGTH,
                                        max: PLATE_MAX_LENGTH,
                                    })}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </FormSectionCard>
    );
}
