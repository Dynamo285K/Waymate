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
    // Presentational config the form can't derive from RHF state.
    dateLocale?: Locale;
    today?: Date;
    timeOptions?: string[];
};

// Date, time and trip duration. All three are RHF fields; only the date
// picker's locale/today and the time option list are passed as config.
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
            <div className="offer-ride-form__grid offer-ride-form__grid--three-columns">
                <div className="offer-ride-form__field">
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
                        <p className="offer-ride-form__field-error">
                            {t(errors.rideDate.message)}
                        </p>
                    )}
                </div>
                <div className="offer-ride-form__field">
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
                            className={`offer-ride-form__time-trigger${!time ? " offer-ride-form__time-trigger--placeholder" : ""}`}
                        >
                            <Select.Value placeholder="--:--" />
                            <Select.Icon className="offer-ride-form__select-icon">
                                <ClockIcon />
                            </Select.Icon>
                        </Select.Trigger>
                        <Select.Portal>
                            <Select.Content
                                className="offer-ride-form__time-dropdown"
                                position="popper"
                                sideOffset={8}
                            >
                                <Select.Viewport>
                                    {timeOptions.map((option) => (
                                        <Select.Item
                                            key={option}
                                            value={option}
                                            className={`offer-ride-form__time-option${time === option ? " offer-ride-form__time-option--active" : ""}`}
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
                        <p className="offer-ride-form__field-error">
                            {t(errors.rideTime.message)}
                        </p>
                    )}
                </div>
                <div
                    className="offer-ride-form__field"
                    data-testid="offer-duration"
                >
                    <FieldLabel
                        label={t("offerRide.duration")}
                        icon={<ClockIcon />}
                    />
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                        }}
                    >
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
                        <span
                            style={{
                                whiteSpace: "nowrap",
                                color: "var(--color-text-secondary)",
                                fontSize: 14,
                            }}
                        >
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
                        <span
                            style={{
                                whiteSpace: "nowrap",
                                color: "var(--color-text-secondary)",
                                fontSize: 14,
                            }}
                        >
                            min
                        </span>
                    </div>
                    {errors.durationHours?.message && (
                        <p className="offer-ride-form__field-error">
                            {t(errors.durationHours.message)}
                        </p>
                    )}
                </div>
            </div>
        </FormSectionCard>
    );
}
