import { useState, useEffect, useRef } from "react";
import * as Popover from "@radix-ui/react-popover";
import { DayPicker } from "react-day-picker";
import { format } from "date-fns";
import type { Locale } from "date-fns";
import { CalendarIcon } from "./icons/CalendarIcon";

export type DatePickerProps = {
    label?: string;
    placeholder?: string;
    value?: Date;
    onChange?: (date: Date | undefined) => void;
    disabled?: boolean;
    locale?: Locale;
    today?: Date;
    disablePastDates?: boolean;
};

type Theme = "light" | "dark";

function startOfDay(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfMonth(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getElementTheme(element: HTMLElement | null): Theme | undefined {
    const themeSource =
        element?.closest<HTMLElement>("[data-theme]") ??
        document.documentElement ??
        document.body;
    const theme = themeSource?.dataset.theme;

    return theme === "light" || theme === "dark" ? theme : undefined;
}

const dayPickerClassNames = {
    months: "flex flex-col",
    month_caption: "flex items-center justify-between mb-2 px-1",
    caption_label: "text-control font-semibold text-text-primary mx-auto",
    nav: "flex items-center gap-1",
    button_previous:
        "inline-flex items-center justify-center w-7 h-7 rounded-full text-text-primary hover:bg-secondary-hover transition-colors duration-100 [&_svg]:w-4 [&_svg]:h-4",
    button_next:
        "inline-flex items-center justify-center w-7 h-7 rounded-full text-text-primary hover:bg-secondary-hover transition-colors duration-100 [&_svg]:w-4 [&_svg]:h-4",
    month_grid: "w-full border-collapse",
    weekdays: "flex",
    weekday:
        "w-9 h-9 flex items-center justify-center text-caption text-text-secondary font-normal",
    week: "flex mt-1",
    day: "relative p-0",
    day_button:
        "w-9 h-9 flex items-center justify-center rounded-md text-sm text-text-primary hover:bg-secondary-hover transition-colors duration-100 cursor-pointer",
    selected:
        "[&>button]:bg-primary [&>button]:text-white [&>button]:hover:bg-primary",
    today: "[&>button]:font-bold [&>button]:outline-2 [&>button]:[outline-offset:-2px] [&>button]:outline-primary",
    disabled:
        "[&>button]:opacity-40 [&>button]:cursor-not-allowed [&>button]:pointer-events-none",
    outside: "[&>button]:opacity-0 [&>button]:pointer-events-none",
    hidden: "invisible",
};

export function DatePicker({
    label,
    placeholder = "dd.mm.rr",
    value,
    onChange,
    disabled = false,
    locale,
    today = new Date(),
    disablePastDates = true,
}: DatePickerProps) {
    const currentDay = startOfDay(today);
    const currentDayTime = currentDay.getTime();
    const currentMonth = startOfMonth(currentDay);
    const [open, setOpen] = useState(false);
    const [visibleMonth, setVisibleMonth] = useState(() => currentMonth);
    const [theme, setTheme] = useState<Theme>();
    const wrapperRef = useRef<HTMLDivElement>(null);

    const isPastDate = (date: Date) =>
        disablePastDates && startOfDay(date).getTime() < currentDayTime;

    const selectedDate = value && !isPastDate(value) ? value : undefined;
    const pastDateMatcher = disablePastDates
        ? { before: currentDay }
        : undefined;

    useEffect(() => {
        if (value && isPastDate(value)) {
            onChange?.(undefined);
        }
    }, [value, disablePastDates, currentDayTime]);

    function handleOpenChange(isOpen: boolean) {
        if (isOpen) {
            setVisibleMonth(currentMonth);
            setTheme(getElementTheme(wrapperRef.current));
        }
        setOpen(isOpen);
    }

    return (
        <div
            ref={wrapperRef}
            className="relative w-full"
        >
            {label && (
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                    {label}
                </label>
            )}

            <Popover.Root
                open={open}
                onOpenChange={handleOpenChange}
            >
                <Popover.Trigger
                    asChild
                    disabled={disabled}
                >
                    <button
                        type="button"
                        className={`w-full flex items-center justify-between py-3 px-4 bg-input border border-border rounded-xl cursor-pointer transition-[border-color] duration-150 box-border hover:border-primary [&_svg]:w-4 [&_svg]:h-4 [&_svg]:text-text-secondary [&_svg]:shrink-0 ${
                            disabled ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                    >
                        <span
                            className={`text-control ${
                                !selectedDate
                                    ? "text-text-secondary"
                                    : "text-text-primary"
                            }`}
                        >
                            {selectedDate
                                ? format(selectedDate, "dd.MM.yyyy")
                                : placeholder}
                        </span>
                        <CalendarIcon />
                    </button>
                </Popover.Trigger>

                <Popover.Portal>
                    <Popover.Content
                        className="z-200 bg-card border border-border rounded-2xl shadow-dropdown p-2"
                        data-theme={theme}
                        sideOffset={8}
                        align="end"
                        avoidCollisions
                    >
                        <DayPicker
                            mode="single"
                            today={currentDay}
                            startMonth={
                                disablePastDates ? currentMonth : undefined
                            }
                            month={visibleMonth}
                            onMonthChange={setVisibleMonth}
                            selected={selectedDate}
                            locale={locale}
                            disabled={pastDateMatcher}
                            classNames={dayPickerClassNames}
                            onDayClick={(day, _modifiers, event) => {
                                if (!isPastDate(day)) return;
                                event.preventDefault();
                                event.stopPropagation();
                            }}
                            onSelect={(date) => {
                                if (date && isPastDate(date)) return;
                                onChange?.(date);
                                setOpen(false);
                            }}
                        />
                    </Popover.Content>
                </Popover.Portal>
            </Popover.Root>
        </div>
    );
}
