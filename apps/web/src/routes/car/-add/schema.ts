import { z } from "zod";
import type { Control } from "react-hook-form";
import { PLATE_MAX_LENGTH, PLATE_MIN_LENGTH } from "@repo/shared/validation";

export const COLORS = [
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

export type CarColor = (typeof COLORS)[number]["value"];

const CAR_COLORS = COLORS.map((c) => c.value) as [CarColor, ...CarColor[]];

export const carFormSchema = z.object({
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

export type CarFormInput = z.input<typeof carFormSchema>;
export type CarFormValues = z.output<typeof carFormSchema>;

export type CarFormControl = Control<CarFormInput, unknown, CarFormValues>;
