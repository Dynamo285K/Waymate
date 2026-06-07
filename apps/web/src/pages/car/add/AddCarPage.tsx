import { Controller, useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useLocation } from "../../../lib/router-compat";
import * as Select from "@radix-ui/react-select";
import { Button, ChevronDownIcon, Input, TextLink } from "@waymate/ui";
import { FieldError } from "../../../components/shared/FieldError";
import type { Language } from "../../../components/controls/LanguageSwitcher";
import { DriverNavbar } from "../../../components/navigation/DriverNavbar";
import { PassengerNavbar } from "../../../components/navigation/PassengerNavbar";
import { useDriverNavbarProps } from "../../driver/hooks/useDriverNavbarProps";
import { usePassengerNavbarProps } from "../../../hooks/shared/usePassengerNavbarProps";
import {
    useGetCarsBrands,
    useGetCarsBrandsByBrandModels,
    usePostCarsMe,
    getGetCarsMeQueryKey,
} from "../../../api-client/cars/cars";
import { getErrorI18nKey } from "../../../lib/api-errors";
import { PLATE_MAX_LENGTH, PLATE_MIN_LENGTH } from "@repo/shared/validation";

type AddCarPageProps = {
    language: Language;
    theme: "light" | "dark";
    onLanguageChange: (lang: Language) => void;
    onThemeToggle: () => void;
    userName?: string;
    userEmail?: string;
};

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

const CAR_COLORS = COLORS.map((c) => c.value) as [CarColor, ...CarColor[]];

const carFormSchema = z.object({
    make: z.string().min(1, "addCar.requiredError"),
    model: z.string().min(1, "addCar.requiredError"),
    seats: z
        .number()
        .int()
        .positive()
        .nullable()
        .refine(
            (value): value is number => value !== null,
            "addCar.requiredError"
        ),
    color: z
        .enum(CAR_COLORS)
        .nullable()
        .refine(
            (value): value is CarColor => value !== null,
            "addCar.requiredError"
        ),
    plate: z
        .string()
        .transform((value) => value.toUpperCase().replace(/[^A-Z0-9]/g, ""))
        .pipe(
            z
                .string()
                .min(1, "addCar.requiredError")
                .min(PLATE_MIN_LENGTH, "addCar.plateLength")
                .max(PLATE_MAX_LENGTH, "addCar.plateLength")
        ),
});

type CarFormInput = z.input<typeof carFormSchema>;
type CarFormValues = z.output<typeof carFormSchema>;

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

    const {
        control,
        handleSubmit,
        watch,
        setValue,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<CarFormInput, unknown, CarFormValues>({
        resolver: zodResolver(carFormSchema),
        defaultValues: {
            make: "",
            model: "",
            seats: null,
            color: null,
            plate: "",
        },
    });

    const make = watch("make");

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
                setError("root", {
                    message: getErrorI18nKey(error, {}, "addCar.error"),
                });
            },
        },
    });

    // Brand/model come straight from the API (`car_models` is seeded
    // reference data — a plain DB read). No offline fallback: a fabricated
    // catalog has no real model id and so produces an un-submittable form.
    const carMakes =
        brandsQuery.data?.map((row) => row.brand).filter(Boolean) ?? [];
    const carModels = modelsQuery.data ?? [];

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
        "w-full rounded-xl border border-(--color-border) bg-(--color-input-bg) text-(--color-text-primary) px-3 py-3 text-sm outline-none focus:border-(--color-primary) focus:ring-2 focus:ring-(--color-primary)/10 transition-colors font-[Inter,sans-serif] appearance-none";
    const labelClass =
        "text-sm font-bold text-(--color-text-primary) mb-1 block";

    const onSubmit: SubmitHandler<CarFormValues> = (values) => {
        const selectedModel = carModels.find(
            (row) => row.modelName === values.model
        );

        if (!selectedModel) {
            setError("model", { message: "addCar.requiredError" });
            return;
        }

        // Schema narrows seats/color to non-null and normalizes plate.
        createCarMutation.mutate({
            data: {
                modelId: selectedModel.id,
                spz: values.plate,
                countryCode: "SK",
                color: values.color,
                seatsTotal: values.seats + 1,
            },
        });
    };

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
                <div className="text-sm mb-6">
                    <TextLink
                        variant="muted"
                        onClick={() => navigate(backPath)}
                    >
                        {t("profile.backToProfile", "<- Back to My Profile")}
                    </TextLink>
                </div>
                <h1 className="text-2xl font-bold text-(--color-text-primary) mb-8">
                    {t("addCar.title")}
                </h1>

                <form
                    onSubmit={handleSubmit(onSubmit)}
                    noValidate
                    className="bg-(--color-card) rounded-2xl border border-(--color-border) overflow-hidden"
                >
                    <div className="p-6 border-b border-(--color-border)">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>
                                    {t("addCar.make")}{" "}
                                    <span className="text-(--color-danger-text)">
                                        *
                                    </span>
                                </label>
                                <Controller
                                    control={control}
                                    name="make"
                                    render={({ field }) => (
                                        <Select.Root
                                            value={field.value}
                                            onValueChange={(val) => {
                                                field.onChange(val);
                                                setValue("model", "");
                                            }}
                                        >
                                            <Select.Trigger
                                                className={
                                                    inputClass +
                                                    " flex items-center justify-between cursor-pointer"
                                                }
                                            >
                                                <Select.Value
                                                    placeholder={t(
                                                        "addCar.selectMake"
                                                    )}
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
                                    )}
                                />
                                <FieldError className="mt-1">
                                    {errors.make?.message &&
                                        t(errors.make.message)}
                                </FieldError>
                            </div>
                            <div>
                                <label className={labelClass}>
                                    {t("addCar.model")}{" "}
                                    <span className="text-(--color-danger-text)">
                                        *
                                    </span>
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
                                                        modelsQuery.isLoading
                                                            ? t(
                                                                  "addCar.loadingModels"
                                                              )
                                                            : t(
                                                                  "addCar.selectModel"
                                                              )
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
                                                                value={
                                                                    m.modelName
                                                                }
                                                                className="flex items-center px-3 py-2 text-sm rounded-lg text-(--color-text-primary) cursor-pointer outline-none data-highlighted:bg-(--color-bg) data-[state=checked]:text-(--color-primary)"
                                                            >
                                                                <Select.ItemText>
                                                                    {
                                                                        m.modelName
                                                                    }
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
                                    {errors.model?.message &&
                                        t(errors.model.message)}
                                </FieldError>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 border-b border-(--color-border)">
                        <label className={labelClass}>
                            {t("addCar.seats")}{" "}
                            <span className="text-(--color-danger-text)">
                                *
                            </span>
                            <span className="font-normal text-(--color-text-secondary) ml-2">
                                {t("addCar.excludingDriver")}
                            </span>
                        </label>
                        <Controller
                            control={control}
                            name="seats"
                            render={({ field }) => (
                                <div className="flex gap-2 mt-3 flex-wrap">
                                    {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
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
                        <FieldError className="mt-2">
                            {errors.seats?.message && t(errors.seats.message)}
                        </FieldError>
                    </div>

                    <div className="p-6 border-b border-(--color-border)">
                        <label className={labelClass}>
                            {t("addCar.color")}{" "}
                            <span className="text-(--color-danger-text)">
                                *
                            </span>
                        </label>
                        <Controller
                            control={control}
                            name="color"
                            render={({ field }) => (
                                <div className="flex gap-3 mt-3 flex-wrap">
                                    {COLORS.map((c) => (
                                        <Button
                                            key={c.value}
                                            type="button"
                                            variant="unstyled"
                                            onClick={() =>
                                                field.onChange(c.value)
                                            }
                                            className="flex flex-col items-center gap-1"
                                        >
                                            <span
                                                className={`w-10 h-10 rounded-full transition-all ${field.value === c.value ? "ring-2 ring-offset-2 ring-(--color-primary) scale-110" : ""}`}
                                                style={{
                                                    backgroundColor: c.hex,
                                                    border: `1.5px solid ${c.border}`,
                                                }}
                                            />
                                            <span className="text-xs text-(--color-text-secondary)">
                                                {c.label}
                                            </span>
                                        </Button>
                                    ))}
                                </div>
                            )}
                        />
                        <FieldError className="mt-2">
                            {errors.color?.message && t(errors.color.message)}
                        </FieldError>
                    </div>

                    <div className="p-6 border-b border-(--color-border)">
                        <label className={labelClass}>
                            {t("addCar.licensePlate")}{" "}
                            <span className="text-(--color-danger-text)">
                                *
                            </span>
                        </label>
                        <div className="flex gap-2 mt-1 items-center">
                            {/* eslint-disable no-restricted-syntax -- SK license plate visual uses real plate colors */}
                            <div className="shrink-0 w-16 h-12 rounded-xl bg-slate-800 flex flex-col items-center justify-center text-white text-xs font-bold">
                                <span className="text-yellow-300 tracking-widest text-[10px]">
                                    ***
                                </span>
                                <span className="text-[11px] mt-0.5">SK</span>
                            </div>
                            {/* eslint-enable no-restricted-syntax */}
                            <Controller
                                control={control}
                                name="plate"
                                render={({ field }) => (
                                    <Input
                                        placeholder="BA123AB"
                                        value={field.value}
                                        onChange={(e) =>
                                            field.onChange(
                                                e.target.value.toUpperCase()
                                            )
                                        }
                                    />
                                )}
                            />
                        </div>
                        <FieldError className="mt-2">
                            {errors.plate?.message &&
                                t(errors.plate.message, {
                                    min: PLATE_MIN_LENGTH,
                                    max: PLATE_MAX_LENGTH,
                                })}
                        </FieldError>
                    </div>

                    <div className="p-6 flex flex-col gap-4 sm:items-end">
                        {errors.root?.message && (
                            <p className="w-full rounded-xl border border-(--color-danger-border) bg-(--color-danger-bg) px-4 py-3 text-sm font-semibold text-(--color-danger-text)">
                                {t(errors.root.message)}
                            </p>
                        )}
                        <Button
                            type="submit"
                            variant="black"
                            disabled={
                                isSubmitting || createCarMutation.isPending
                            }
                        >
                            {createCarMutation.isPending
                                ? t("addCar.adding")
                                : t("addCar.addButton")}
                        </Button>
                    </div>
                </form>
            </section>
        </div>
    );
}
