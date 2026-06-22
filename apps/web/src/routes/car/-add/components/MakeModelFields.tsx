import { Controller } from "react-hook-form";
import { useTranslation } from "react-i18next";
import * as Select from "@radix-ui/react-select";
import { ChevronDownIcon } from "@waymate/ui";
import { FieldError } from "../../../../components/shared/FieldError";
import type { CarModel } from "../../../../api-client/model/carModel";
import { inputClass, labelClass } from "../field-styles";
import type { CarFormControl } from "../schema";

type MakeModelFieldsProps = {
    control: CarFormControl;
    makeError?: string;
    modelError?: string;
    make: string;
    carMakes: string[];
    carModels: CarModel[];
    isModelsLoading: boolean;
    onMakeChange: () => void;
};

export function MakeModelFields({
    control,
    makeError,
    modelError,
    make,
    carMakes,
    carModels,
    isModelsLoading,
    onMakeChange,
}: MakeModelFieldsProps) {
    const { t } = useTranslation();

    return (
        <div className="p-6 border-b border-border">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className={labelClass}>
                        {t("addCar.make")}{" "}
                        <span className="text-danger-text">*</span>
                    </label>
                    <Controller
                        control={control}
                        name="make"
                        render={({ field }) => (
                            <Select.Root
                                value={field.value}
                                onValueChange={(val) => {
                                    field.onChange(val);
                                    onMakeChange();
                                }}
                            >
                                <Select.Trigger
                                    className={
                                        inputClass +
                                        " flex items-center justify-between cursor-pointer"
                                    }
                                >
                                    <Select.Value
                                        placeholder={t("addCar.selectMake")}
                                    />
                                    <Select.Icon className="text-text-secondary shrink-0">
                                        <ChevronDownIcon />
                                    </Select.Icon>
                                </Select.Trigger>
                                <Select.Portal>
                                    <Select.Content
                                        className="z-1100 w-radix-select-trigger rounded-xl border border-border bg-card p-1 shadow-lg"
                                        position="popper"
                                        sideOffset={4}
                                    >
                                        <Select.Viewport>
                                            {carMakes.map((m) => (
                                                <Select.Item
                                                    key={m}
                                                    value={m}
                                                    className="flex items-center px-3 py-2 text-sm rounded-lg text-text-primary cursor-pointer outline-none data-highlighted:bg-background radix-checked:text-primary"
                                                >
                                                    <Select.ItemText>
                                                        {m}
                                                    </Select.ItemText>
                                                </Select.Item>
                                            ))}
                                        </Select.Viewport>
                                    </Select.Content>
                                </Select.Portal>
                            </Select.Root>
                        )}
                    />
                    <FieldError className="mt-1">
                        {makeError && t(makeError)}
                    </FieldError>
                </div>
                <div>
                    <label className={labelClass}>
                        {t("addCar.model")}{" "}
                        <span className="text-danger-text">*</span>
                    </label>
                    <Controller
                        control={control}
                        name="model"
                        render={({ field }) => (
                            <Select.Root
                                value={field.value}
                                onValueChange={field.onChange}
                                disabled={!make}
                            >
                                <Select.Trigger
                                    className={
                                        inputClass +
                                        " flex items-center justify-between cursor-pointer data-disabled:opacity-50 data-disabled:cursor-not-allowed"
                                    }
                                >
                                    <Select.Value
                                        placeholder={
                                            isModelsLoading
                                                ? t("addCar.loadingModels")
                                                : t("addCar.selectModel")
                                        }
                                    />
                                    <Select.Icon className="text-text-secondary shrink-0">
                                        <ChevronDownIcon />
                                    </Select.Icon>
                                </Select.Trigger>
                                <Select.Portal>
                                    <Select.Content
                                        className="z-1100 w-radix-select-trigger rounded-xl border border-border bg-card p-1 shadow-lg"
                                        position="popper"
                                        sideOffset={4}
                                    >
                                        <Select.Viewport>
                                            {carModels.map((m) => (
                                                <Select.Item
                                                    key={m.id}
                                                    value={m.modelName}
                                                    className="flex items-center px-3 py-2 text-sm rounded-lg text-text-primary cursor-pointer outline-none data-highlighted:bg-background radix-checked:text-primary"
                                                >
                                                    <Select.ItemText>
                                                        {m.modelName}
                                                    </Select.ItemText>
                                                </Select.Item>
                                            ))}
                                        </Select.Viewport>
                                    </Select.Content>
                                </Select.Portal>
                            </Select.Root>
                        )}
                    />
                    <FieldError className="mt-1">
                        {modelError && t(modelError)}
                    </FieldError>
                </div>
            </div>
        </div>
    );
}
