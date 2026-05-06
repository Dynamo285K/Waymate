import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useLocation } from "../lib/router-compat";
import * as Select from "@radix-ui/react-select";
import { Button, ChevronDownIcon } from "@waymate/ui";
import type { Language } from "../components/controls/LanguageSwitcher";
import { DriverNavbar } from "../components/navigation/DriverNavbar";
import { PassengerNavbar } from "../components/navigation/PassengerNavbar";
import { useDriverNavbarProps } from "../hooks/useDriverNavbarProps";
import { usePassengerNavbarProps } from "../hooks/usePassengerNavbarProps";
import {
    useGetCarsBrands,
    useGetCarsBrandsByBrandModels,
    usePostCarsMe,
    getGetCarsMeQueryKey,
} from "../api-client/cars/cars";
import { getErrorI18nKey } from "../lib/api-errors";
import carData from "../../../api/src/db/cars-data.json";

type AddCarPageProps = {
    language: Language;
    theme: "light" | "dark";
    onLanguageChange: (lang: Language) => void;
    onThemeToggle: () => void;
    userName?: string;
    userEmail?: string;
};

type CarModelRow = {
    id: number;
    brand: string;
    modelName: string;
};

const FALLBACK_CAR_MAKES = [
    "Skoda",
    "Volkswagen",
    "BMW",
    "Audi",
    "Toyota",
    "Ford",
    "Hyundai",
    "Kia",
    "Renault",
    "Peugeot",
    "Seat",
    "Honda",
    "Volvo",
    "Mercedes-Benz",
    "Opel",
];

const COLORS = [
    { value: "WHITE", label: "White", hex: "#f8fafc", border: "#cbd5e1" },
    { value: "BLACK", label: "Black", hex: "#111827", border: "#111827" },
    { value: "SILVER", label: "Silver", hex: "#c0c0c0", border: "#c0c0c0" },
    { value: "GRAY", label: "Gray", hex: "#6b7280", border: "#6b7280" },
    { value: "RED", label: "Red", hex: "#dc2626", border: "#dc2626" },
    { value: "BLUE", label: "Blue", hex: "#2563eb", border: "#2563eb" },
    { value: "BROWN", label: "Brown", hex: "#92400e", border: "#92400e" },
    { value: "GREEN", label: "Green", hex: "#16a34a", border: "#16a34a" },
    { value: "YELLOW", label: "Yellow", hex: "#eab308", border: "#eab308" },
    { value: "ORANGE", label: "Orange", hex: "#ea580c", border: "#ea580c" },
    { value: "OTHER", label: "Other", hex: "#ffffff", border: "#94a3b8" },
] as const;

type CarColor = (typeof COLORS)[number]["value"];

export function AddCarPage({
    language,
    theme,
    onLanguageChange,
    onThemeToggle,
    userName,
    userEmail,
}: AddCarPageProps) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const location = useLocation();
    const role =
        (location.state as { role?: "passenger" | "driver" } | null)?.role ??
        "driver";
    const backPath =
        role === "driver" ? "/driver/profile" : "/passenger/profile";

    const [make, setMake] = useState("");
    const [model, setModel] = useState("");
    const [seats, setSeats] = useState<number | null>(null);
    const [color, setColor] = useState<CarColor | null>(null);
    const [plate, setPlate] = useState("");
    const [formError, setFormError] = useState("");

    const brandsQuery = useGetCarsBrands();
    const modelsQuery = useGetCarsBrandsByBrandModels(make, {
        query: { enabled: Boolean(make) },
    });

    const createCarMutation = usePostCarsMe({
        mutation: {
            onSuccess: async () => {
                await queryClient.invalidateQueries({
                    queryKey: getGetCarsMeQueryKey(),
                });
                navigate(backPath);
            },
            onError: (error) => {
                setFormError(getErrorI18nKey(error, {}, "addCar.error"));
            },
        },
    });

    const apiCarMakes =
        brandsQuery.data?.map((row) => row.brand).filter(Boolean) ?? [];
    const carMakes = apiCarMakes.length > 0 ? apiCarMakes : FALLBACK_CAR_MAKES;
    const fallbackModels = (carData as CarModelRow[])
        .filter((row) => row.brand === make)
        .sort((a, b) => a.modelName.localeCompare(b.modelName));
    const carModels =
        modelsQuery.data && modelsQuery.data.length > 0
            ? modelsQuery.data
            : fallbackModels;

    const driverNavbarProps = useDriverNavbarProps({
        language,
        onLanguageChange,
        theme,
        onThemeToggle,
        userName,
        userEmail,
    });
    const passengerNavbarProps = usePassengerNavbarProps({
        activeTab: "find-ride",
        language,
        onLanguageChange,
        theme,
        onThemeToggle,
        userName,
        userEmail,
    });

    const inputClass =
        "w-full rounded-xl border border-(--color-border) bg-(--color-input-bg) text-(--color-text-primary) px-3 py-3 text-sm outline-none focus:border-(--color-primary) focus:ring-2 focus:ring-green-100 transition-colors font-[Inter,sans-serif] appearance-none";
    const labelClass =
        "text-sm font-bold text-(--color-text-primary) mb-1 block";

    function handleAddCar() {
        setFormError("");

        const selectedModel = carModels.find((row) => row.modelName === model);
        const normalizedPlate = plate.toUpperCase().replace(/[^A-Z0-9]/g, "");

        if (!make || !selectedModel || !seats || !color || !normalizedPlate) {
            setFormError("addCar.requiredError");
            return;
        }

        createCarMutation.mutate({
            data: {
                modelId: selectedModel.id,
                spz: normalizedPlate,
                countryCode: "SK",
                color,
                seatsTotal: seats + 1,
            },
        });
    }

    return (
        <div
            data-theme={theme}
            className="min-h-screen bg-(--color-bg)"
        >
            {role === "driver" ? (
                <DriverNavbar {...driverNavbarProps} />
            ) : (
                <PassengerNavbar {...passengerNavbarProps} />
            )}

            <section className="w-full px-4 sm:max-w-2xl sm:mx-auto sm:px-8 py-8 sm:py-12">
                <button
                    type="button"
                    onClick={() => navigate(backPath)}
                    className="text-(--color-text-secondary) text-sm mb-6 hover:text-(--color-text-primary) transition-colors"
                >
                    {t("profile.backToProfile")}
                </button>
                <h1 className="text-2xl font-bold text-(--color-text-primary) mb-8">
                    {t("addCar.title")}
                </h1>

                <div className="bg-(--color-card) rounded-2xl border border-(--color-border) overflow-hidden">
                    <div className="p-6 border-b border-(--color-border)">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>
                                    {t("addCar.make")}{" "}
                                    <span className="text-(--color-red)">
                                        *
                                    </span>
                                </label>
                                <Select.Root
                                    value={make}
                                    onValueChange={(val) => {
                                        setMake(val);
                                        setModel("");
                                        setFormError("");
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
                                        <Select.Icon className="text-(--color-text-secondary) shrink-0">
                                            <ChevronDownIcon />
                                        </Select.Icon>
                                    </Select.Trigger>
                                    <Select.Portal>
                                        <Select.Content
                                            className="z-1100 w-(--radix-select-trigger-width) rounded-xl border border-(--color-border) bg-(--color-card) p-1 shadow-lg"
                                            position="popper"
                                            sideOffset={4}
                                        >
                                            <Select.Viewport>
                                                {carMakes.map((m) => (
                                                    <Select.Item
                                                        key={m}
                                                        value={m}
                                                        className="flex items-center px-3 py-2 text-sm rounded-lg text-(--color-text-primary) cursor-pointer outline-none data-highlighted:bg-(--color-bg) data-[state=checked]:text-(--color-primary)"
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
                            </div>
                            <div>
                                <label className={labelClass}>
                                    {t("addCar.model")}{" "}
                                    <span className="text-(--color-red)">
                                        *
                                    </span>
                                </label>
                                <Select.Root
                                    value={model}
                                    onValueChange={(val) => {
                                        setModel(val);
                                        setFormError("");
                                    }}
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
                                                modelsQuery.isLoading
                                                    ? t("addCar.loadingModels")
                                                    : t("addCar.selectModel")
                                            }
                                        />
                                        <Select.Icon className="text-(--color-text-secondary) shrink-0">
                                            <ChevronDownIcon />
                                        </Select.Icon>
                                    </Select.Trigger>
                                    <Select.Portal>
                                        <Select.Content
                                            className="z-1100 w-(--radix-select-trigger-width) rounded-xl border border-(--color-border) bg-(--color-card) p-1 shadow-lg"
                                            position="popper"
                                            sideOffset={4}
                                        >
                                            <Select.Viewport>
                                                {carModels.map((m) => (
                                                    <Select.Item
                                                        key={m.id}
                                                        value={m.modelName}
                                                        className="flex items-center px-3 py-2 text-sm rounded-lg text-(--color-text-primary) cursor-pointer outline-none data-highlighted:bg-(--color-bg) data-[state=checked]:text-(--color-primary)"
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
                            </div>
                        </div>
                    </div>

                    <div className="p-6 border-b border-(--color-border)">
                        <label className={labelClass}>
                            {t("addCar.seats")}{" "}
                            <span className="text-(--color-red)">*</span>
                            <span className="font-normal text-(--color-text-secondary) ml-2">
                                {t("addCar.excludingDriver")}
                            </span>
                        </label>
                        <div className="flex gap-2 mt-3 flex-wrap">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                                <button
                                    key={n}
                                    type="button"
                                    onClick={() => {
                                        setSeats(n);
                                        setFormError("");
                                    }}
                                    className={`w-12 h-12 rounded-xl border-2 font-semibold text-sm transition-all ${
                                        seats === n
                                            ? "border-(--color-primary) bg-(--color-primary)/10 text-(--color-primary)"
                                            : "border-(--color-border) bg-(--color-card) text-(--color-text-primary) hover:border-(--color-primary)"
                                    }`}
                                >
                                    {n}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="p-6 border-b border-(--color-border)">
                        <label className={labelClass}>
                            {t("addCar.color")}{" "}
                            <span className="text-(--color-red)">*</span>
                        </label>
                        <div className="flex gap-3 mt-3 flex-wrap">
                            {COLORS.map((c) => (
                                <button
                                    key={c.value}
                                    type="button"
                                    onClick={() => {
                                        setColor(c.value);
                                        setFormError("");
                                    }}
                                    className="flex flex-col items-center gap-1"
                                >
                                    <span
                                        className={`w-10 h-10 rounded-full transition-all ${color === c.value ? "ring-2 ring-offset-2 ring-(--color-primary) scale-110" : ""}`}
                                        style={{
                                            backgroundColor: c.hex,
                                            border: `1.5px solid ${c.border}`,
                                        }}
                                    />
                                    <span className="text-xs text-(--color-text-secondary)">
                                        {c.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="p-6 border-b border-(--color-border)">
                        <label className={labelClass}>
                            {t("addCar.licensePlate")}{" "}
                            <span className="text-(--color-red)">*</span>
                        </label>
                        <div className="flex gap-2 mt-1 items-center">
                            <div className="flex-shrink-0 w-16 h-12 rounded-xl bg-slate-800 flex flex-col items-center justify-center text-white text-xs font-bold">
                                <span className="text-yellow-300 tracking-widest text-[10px]">
                                    ***
                                </span>
                                <span className="text-[11px] mt-0.5">SK</span>
                            </div>
                            <input
                                className={inputClass + " flex-1"}
                                placeholder="BA123AB"
                                value={plate}
                                onChange={(e) => {
                                    setPlate(e.target.value.toUpperCase());
                                    setFormError("");
                                }}
                            />
                        </div>
                    </div>

                    <div className="p-6 flex flex-col gap-4 sm:items-end">
                        {formError && (
                            <p className="w-full rounded-xl border border-(--color-danger-border) bg-(--color-danger-bg) px-4 py-3 text-sm font-semibold text-(--color-danger-text)">
                                {t(formError)}
                            </p>
                        )}
                        <Button
                            type="button"
                            variant="black"
                            onClick={handleAddCar}
                            disabled={createCarMutation.isPending}
                        >
                            {createCarMutation.isPending
                                ? t("addCar.adding")
                                : t("addCar.addButton")}
                        </Button>
                    </div>
                </div>
            </section>
        </div>
    );
}
