import * as Select from "@radix-ui/react-select";
import type { Locale } from "date-fns";
import { useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
    DatePicker,
    FieldLabel,
    FormSectionCard,
    CalendarIcon,
    ClockIcon,
} from "@waymate/ui";
import { formatTime } from "../../../../lib/date-format";
import type { EtaPreview } from "../-hooks/useEtaPreview";
import type { OfferRideFormInput } from "./schema";

const DEFAULT_TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
    const h = Math.floor(i / 2);
    const m = i % 2 === 0 ? "00" : "30";
    return `${String(h).padStart(2, "0")}:${m}`;
});

type ScheduleSectionProps = {
    dateLocale?: Locale;
    today?: Date;
    timeOptions?: string[];
    etaPreview: EtaPreview;
};

export function ScheduleSection({
    dateLocale,
    today,
    timeOptions = DEFAULT_TIME_OPTIONS,
    etaPreview,
}: ScheduleSectionProps) {
    const { t } = useTranslation();
    const { watch, setValue, formState } = useFormContext<OfferRideFormInput>();
    const { errors, isSubmitted } = formState;

    const time = watch("rideTime");

    return (
        <FormSectionCard title={t("offerRide.dateTime")}>
            <div className="grid grid-cols-2 gap-5 max-md:grid-cols-1">
                <div className="flex flex-col gap-2.5">
                    <FieldLabel
                        label={t("offerRide.date")}
                        icon={<CalendarIcon />}
                    />
                    <div data-testid="offer-date">
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
                    </div>
                    {errors.rideDate?.message && (
                        <p className="-mt-0.5 text-danger-text text-xs font-semibold">
                            {t(errors.rideDate.message)}
                        </p>
                    )}
                </div>
                <div className="flex flex-col gap-2.5">
                    <FieldLabel
                        label={t("offerRide.time")}
                        icon={<ClockIcon />}
                    />
                    <div data-testid="offer-time">
                        <Select.Root
                            value={time || undefined}
                            onValueChange={(value) =>
                                setValue("rideTime", value, {
                                    shouldValidate: isSubmitted,
                                })
                            }
                        >
                            <Select.Trigger
                                className={`w-full flex items-center justify-between gap-2 py-3 px-4 rounded-xl border border-border bg-input text-sm font-medium cursor-pointer transition-colors duration-150 outline-none hover:border-primary focus-visible:border-primary icon-svg:text-text-secondary icon-svg:shrink-0 ${!time ? "text-text-secondary" : "text-text-primary"}`}
                            >
                                <Select.Value placeholder="--:--" />
                                <Select.Icon className="inline-flex items-center">
                                    <ClockIcon />
                                </Select.Icon>
                            </Select.Trigger>
                            <Select.Portal>
                                <Select.Content
                                    className="w-radix-select-trigger max-h-64 overflow-y-auto rounded-xl border border-border bg-card p-1 shadow-dropdown-strong z-time-select"
                                    position="popper"
                                    sideOffset={8}
                                >
                                    <Select.Viewport>
                                        {timeOptions.map((option) => (
                                            <Select.Item
                                                key={option}
                                                value={option}
                                                className="w-full py-2 px-3 rounded-lg border-0 bg-transparent text-text-primary text-sm font-semibold text-left cursor-pointer transition-colors duration-100 outline-none select-none flex items-center hover:bg-background radix-highlighted:bg-background radix-highlighted:outline-none radix-checked:bg-primary-tint radix-checked:text-primary"
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
                    </div>
                    {errors.rideTime?.message && (
                        <p className="-mt-0.5 text-danger-text text-xs font-semibold">
                            {t(errors.rideTime.message)}
                        </p>
                    )}
                </div>
            </div>
            {etaPreview.isLoading && (
                <p
                    className="mt-3 text-sm text-text-secondary"
                    data-testid="eta-preview-loading"
                >
                    {t("offerRide.estimatedArrivalLoading")}
                </p>
            )}
            {!etaPreview.isLoading && etaPreview.arrivalEstimateAt && (
                <p
                    className="mt-3 text-sm font-semibold text-text-primary"
                    data-testid="eta-preview"
                >
                    {t("offerRide.estimatedArrival", {
                        time: formatTime(etaPreview.arrivalEstimateAt),
                    })}
                </p>
            )}
        </FormSectionCard>
    );
}
