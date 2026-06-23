import * as Select from "@radix-ui/react-select";
import { useTranslation } from "react-i18next";
import { FieldLabel, CarIcon, ChevronDownIcon } from "@waymate/ui";
import type { OfferRideCar } from "../CarSection";
import {
    selectTrigger,
    selectContent,
    selectViewport,
    selectItem,
    selectAdornmentClass,
} from "./select-styles";

export type SavedCarPickerProps = {
    savedCars: OfferRideCar[];
    selectedCarId: string;
    onSelectedCarChange: (id: string) => void;
};

/** Saved-car branch: a dropdown of the driver's cars plus a read-only summary. */
export function SavedCarPicker({
    savedCars,
    selectedCarId,
    onSelectedCarChange,
}: SavedCarPickerProps) {
    const { t } = useTranslation();
    const selectedCar = savedCars.find((c) => c.id === selectedCarId);

    return (
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
                        <Select.Value placeholder={t("offerRide.chooseCar")} />
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
                                {savedCars.map((car) => (
                                    <Select.Item
                                        key={car.id}
                                        value={car.id}
                                        className={selectItem}
                                    >
                                        <Select.ItemText>
                                            {car.brand} {car.model} – {car.plate}
                                        </Select.ItemText>
                                    </Select.Item>
                                ))}
                            </Select.Viewport>
                        </Select.Content>
                    </Select.Portal>
                </Select.Root>
            </div>
            <div className="grid grid-cols-2 gap-5 max-md:grid-cols-1">
                <div className="py-3 px-4 rounded-xl border border-border bg-background">
                    <p className="m-0 text-badge font-bold uppercase tracking-badge text-text-secondary">
                        {t("offerRide.carBrand")}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-text-primary">
                        {selectedCar?.brand ?? "—"}
                    </p>
                </div>
                <div className="py-3 px-4 rounded-xl border border-border bg-background">
                    <p className="m-0 text-badge font-bold uppercase tracking-badge text-text-secondary">
                        {t("offerRide.carModel")}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-text-primary">
                        {selectedCar?.model ?? "—"}
                    </p>
                </div>
                <div className="col-span-full py-3 px-4 rounded-xl border border-border bg-background max-md:col-span-1">
                    <p className="m-0 text-badge font-bold uppercase tracking-badge text-text-secondary">
                        {t("offerRide.licensePlate")}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-text-primary">
                        {selectedCar?.plate ?? "—"}
                    </p>
                </div>
            </div>
        </div>
    );
}
