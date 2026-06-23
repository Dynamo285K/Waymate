import { useTranslation } from "react-i18next";
import { FormSectionCard, SegmentedControl } from "@waymate/ui";
import { SavedCarPicker } from "./car-section/SavedCarPicker";
import { ManualCarFields } from "./car-section/ManualCarFields";

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

    const hasSavedCars = savedCars.length > 0;

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
                <SavedCarPicker
                    savedCars={savedCars}
                    selectedCarId={selectedCarId}
                    onSelectedCarChange={onSelectedCarChange}
                />
            ) : (
                <ManualCarFields
                    hasSavedCars={hasSavedCars}
                    brandOptions={brandOptions}
                    brandLoading={brandLoading}
                    modelOptions={modelOptions}
                    modelLoading={modelLoading}
                />
            )}
        </FormSectionCard>
    );
}
