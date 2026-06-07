import * as Select from "@radix-ui/react-select";
import type { Locale } from "date-fns";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
    DatePicker,
    FieldLabel,
    FormSectionCard,
    Input,
    CalendarIcon,
    ClockIcon,
} from "@waymate/ui";
import type { OfferRideFormInput } from "./schema";

const DEFAULT_TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
    const h = Math.floor(i / 2);
    const m = i % 2 === 0 ? "00" : "30";
    return `${String(h).padStart(2, "0")}:${m}`;
});

function clampDurationInput(value: string, max: number): string {
    if (value === "") return "";
    const n = Number.parseInt(value, 10);
    if (Number.isNaN(n) || n < 0) return "0";
    if (n > max) return String(max);
    return String(n);
}

type ScheduleSectionProps = {
    dateLocale?: Locale;
    today?: Date;
    timeOptions?: string[];
};

export function ScheduleSection({
    dateLocale,
    today,
    timeOptions = DEFAULT_TIME_OPTIONS,
}: ScheduleSectionProps) {
    const { t } = useTranslation();
    const { watch, setValue, formState } = useFormContext<OfferRideFormInput>();
    const { errors, isSubmitted } = formState;

    const time = watch("rideTime");

    return (
        <FormSectionCard title={t("offerRide.dateTime")}>
            <div className="grid grid-cols-3 gap-5 max-md:grid-cols-1">
                <div className="flex flex-col gap-2.5">
                    <FieldLabel
                        label={t("offerRide.date")}
                        icon={<CalendarIcon />}
                    />
                    <DatePicker
                        value={watch("rideDate")}
                        onChange={(date) =>
                            setValue("rideDate", date, {
                                shouldValidate: isSubmitted,
                            })
                        }
                        locale={dateLocale}
                        today={today}
                        disablePastDates
                    />
                    {errors.rideDate?.message && (
                        <p className="-mt-0.5 text-(--color-danger-text) text-xs font-semibold">
                            {t(errors.rideDate.message)}
                        </p>
                    )}
                </div>
                <div className="flex flex-col gap-2.5">
                    <FieldLabel
                        label={t("offerRide.time")}
                        icon={<ClockIcon />}
                    />
                    <Select.Root
                        value={time || undefined}
                        onValueChange={(value) =>
                            setValue("rideTime", value, {
                                shouldValidate: isSubmitted,
                            })
                        }
                    >
                        <Select.Trigger
                            className={`w-full flex items-center justify-between gap-2 py-3 px-4 rounded-xl border border-(--color-border) bg-(--color-input-bg) text-sm font-medium cursor-pointer transition-[border-color] duration-150 outline-none hover:border-(--color-primary) focus-visible:border-(--color-primary) [&_svg]:text-(--color-text-secondary) [&_svg]:shrink-0 ${!time ? "text-(--color-text-secondary)" : "text-(--color-text-primary)"}`}
                        >
                            <Select.Value placeholder="--:--" />
                            <Select.Icon className="inline-flex items-center">
                                <ClockIcon />
                            </Select.Icon>
                        </Select.Trigger>
                        <Select.Portal>
                            <Select.Content
                                className="w-(--radix-select-trigger-width) max-h-64 overflow-y-auto rounded-xl border border-(--color-border) bg-(--color-card) p-1 shadow-[0_8px_24px_rgba(0,0,0,0.12)] z-[200]"
                                position="popper"
                                sideOffset={8}
                            >
                                <Select.Viewport>
                                    {timeOptions.map((option) => (
                                        <Select.Item
                                            key={option}
                                            value={option}
                                            className="w-full py-2 px-3 rounded-lg border-0 bg-transparent text-(--color-text-primary) text-sm font-semibold text-left cursor-pointer transition-[background] duration-100 outline-none select-none flex items-center hover:bg-(--color-bg) data-[highlighted]:bg-(--color-bg) data-[highlighted]:outline-none data-[state=checked]:bg-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] data-[state=checked]:text-(--color-primary)"
                                        >
                                            <Select.ItemText>
                                                {option}
                                            </Select.ItemText>
                                        </Select.Item>
                                    ))}
                                </Select.Viewport>
                            </Select.Content>
                        </Select.Portal>
                    </Select.Root>
                    {errors.rideTime?.message && (
                        <p className="-mt-0.5 text-(--color-danger-text) text-xs font-semibold">
                            {t(errors.rideTime.message)}
                        </p>
                    )}
                </div>
                <div
                    className="flex flex-col gap-2.5"
                    data-testid="offer-duration"
                >
                    <FieldLabel
                        label={t("offerRide.duration")}
                        icon={<ClockIcon />}
                    />
                    <div className="flex items-center gap-2">
                        <Input
                            type="number"
                            value={watch("durationHours")}
                            onChange={(e) =>
                                setValue(
                                    "durationHours",
                                    clampDurationInput(e.target.value, 23),
                                    { shouldValidate: isSubmitted }
                                )
                            }
                            placeholder=""
                            style={{ width: "100%" }}
                        />
                        <span className="whitespace-nowrap text-(--color-text-secondary) text-sm">
                            h
                        </span>
                        <Input
                            type="number"
                            value={watch("durationMinutes")}
                            onChange={(e) =>
                                setValue(
                                    "durationMinutes",
                                    clampDurationInput(e.target.value, 59),
                                    { shouldValidate: isSubmitted }
                                )
                            }
                            placeholder=""
                            style={{ width: "100%" }}
                        />
                        <span className="whitespace-nowrap text-(--color-text-secondary) text-sm">
                            min
                        </span>
                    </div>
                    {errors.durationHours?.message && (
                        <p className="-mt-0.5 text-(--color-danger-text) text-xs font-semibold">
                            {t(errors.durationHours.message)}
                        </p>
                    )}
                </div>
            </div>
        </FormSectionCard>
    );
}
