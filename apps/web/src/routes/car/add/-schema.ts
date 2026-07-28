import { z } from "zod";
import type { Control } from "react-hook-form";
import { PLATE_MAX_LENGTH, PLATE_MIN_LENGTH } from "@repo/shared/validation";
import { CAR_COLORS, type CarColor } from "@/lib/car-colors";

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
