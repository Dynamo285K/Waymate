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

// Car picker. The saved-car list + mode + selection are session state owned by
// the page (useDriverCars); the manual brand/model/plate are RHF fields read
// from form context, including the "changing brand clears the model" rule.
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
        // A new brand invalidates the previously chosen model.
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
                <div className="offer-ride-form__car-saved">
                    <div className="offer-ride-form__field">
                        <FieldLabel
                            label={t("offerRide.chooseCar")}
                            icon={<CarIcon />}
                        />
                        <Select.Root
                            value={selectedCarId || undefined}
                            onValueChange={onSelectedCarChange}
                        >
                            <Select.Trigger className="offer-ride-form__select-trigger">
                                <Select.Value
                                    placeholder={t("offerRide.chooseCar")}
                                />
                                <Select.Icon className="offer-ride-form__select-icon">
                                    <ChevronDownIcon />
                                </Select.Icon>
                            </Select.Trigger>
                            <Select.Portal>
                                <Select.Content
                                    className="offer-ride-form__select-content"
                                    position="popper"
                                    sideOffset={8}
                                >
                                    <Select.Viewport>
                                        {savedCars.map((car) => (
                                            <Select.Item
                                                key={car.id}
                                                value={car.id}
                                                className="offer-ride-form__select-item"
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
                    <div className="offer-ride-form__grid offer-ride-form__grid--two-columns">
                        <div className="offer-ride-form__car-info">
                            <p className="offer-ride-form__car-info-label">
                                {t("offerRide.carBrand")}
                            </p>
                            <p className="offer-ride-form__car-info-value">
                                {selectedCar?.brand ?? "—"}
                            </p>
                        </div>
                        <div className="offer-ride-form__car-info">
                            <p className="offer-ride-form__car-info-label">
                                {t("offerRide.carModel")}
                            </p>
                            <p className="offer-ride-form__car-info-value">
                                {selectedCar?.model ?? "—"}
                            </p>
                        </div>
                        <div className="offer-ride-form__car-info offer-ride-form__car-info--full">
                            <p className="offer-ride-form__car-info-label">
                                {t("offerRide.licensePlate")}
                            </p>
                            <p className="offer-ride-form__car-info-value">
                                {selectedCar?.plate ?? "—"}
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="offer-ride-form__car-manual">
                    {!hasSavedCars && (
                        <p className="offer-ride-form__no-cars">
                            {t("offerRide.noCars")}
                        </p>
                    )}
                    <div className="offer-ride-form__grid offer-ride-form__grid--two-columns">
                        <div className="offer-ride-form__field">
                            <FieldLabel
                                label={t("offerRide.carBrand")}
                                icon={<CarIcon />}
                            />
                            <Select.Root
                                value={manualBrand || undefined}
                                onValueChange={handleBrandChange}
                                disabled={brandLoading}
                            >
                                <Select.Trigger className="offer-ride-form__select-trigger">
                                    <Select.Value
                                        placeholder={
                                            brandLoading
                                                ? t(
                                                      "offerRide.loadingCarBrands"
                                                  )
                                                : t("offerRide.selectCarBrand")
                                        }
                                    />
                                    <Select.Icon className="offer-ride-form__select-icon">
                                        <ChevronDownIcon />
                                    </Select.Icon>
                                </Select.Trigger>
                                <Select.Portal>
                                    <Select.Content
                                        className="offer-ride-form__select-content"
                                        position="popper"
                                        sideOffset={8}
                                    >
                                        <Select.Viewport className="offer-ride-form__select-viewport">
                                            {brandOptions.map((brand) => (
                                                <Select.Item
                                                    key={brand}
                                                    value={brand}
                                                    className="offer-ride-form__select-item"
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
                                <p className="offer-ride-form__field-error">
                                    {t(errors.manualBrand.message)}
                                </p>
                            )}
                        </div>
                        <div className="offer-ride-form__field">
                            <FieldLabel label={t("offerRide.carModel")} />
                            <Select.Root
                                value={manualModel || undefined}
                                onValueChange={handleModelChange}
                                disabled={modelLoading || !manualBrand}
                            >
                                <Select.Trigger className="offer-ride-form__select-trigger">
                                    <Select.Value
                                        placeholder={
                                            modelLoading
                                                ? t(
                                                      "offerRide.loadingCarModels"
                                                  )
                                                : t("offerRide.selectCarModel")
                                        }
                                    />
                                    <Select.Icon className="offer-ride-form__select-icon">
                                        <ChevronDownIcon />
                                    </Select.Icon>
                                </Select.Trigger>
                                <Select.Portal>
                                    <Select.Content
                                        className="offer-ride-form__select-content"
                                        position="popper"
                                        sideOffset={8}
                                    >
                                        <Select.Viewport className="offer-ride-form__select-viewport">
                                            {modelOptions.map((model) => (
                                                <Select.Item
                                                    key={model}
                                                    value={model}
                                                    className="offer-ride-form__select-item"
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
                                <p className="offer-ride-form__field-error">
                                    {t(errors.manualModel.message)}
                                </p>
                            )}
                        </div>
                        <div className="offer-ride-form__field offer-ride-form__field--full">
                            <FieldLabel label={t("offerRide.licensePlate")} />
                            <Input
                                value={manualPlate}
                                onChange={(e) =>
                                    handlePlateChange(e.target.value)
                                }
                                placeholder={t("offerRide.platePlaceholder")}
                            />
                            {errors.manualPlate?.message && (
                                <p className="offer-ride-form__field-error">
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
