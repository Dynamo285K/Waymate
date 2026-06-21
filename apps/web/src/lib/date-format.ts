import i18n from "../i18n";

export function formatDuration(
    departureAt: string | Date,
    arrivalEstimateAt: string | null | undefined
): string | undefined {
    if (!arrivalEstimateAt) return undefined;
    const depMs = new Date(departureAt).getTime();
    const arrMs = new Date(arrivalEstimateAt).getTime();
    const totalMins = Math.round((arrMs - depMs) / 60_000);
    if (totalMins <= 0) return undefined;
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    if (h === 0) return `${m} min`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}min`;
}

const LOCALE_MAP: Record<string, string> = {
    en: "en-US",
    sk: "sk-SK",
    cs: "cs-CZ",
};

export function formatTime(date: Date): string {
    const locale = LOCALE_MAP[i18n.language] ?? "en-US";
    return new Intl.DateTimeFormat(locale, {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    }).format(date);
}

// Day-group label for chat separators: "Today" / "Yesterday" (labels passed in
// by the caller for i18n) or a formatted date, with the year only when it
// differs from the current one.
export function formatDayLabel(
    value: string | Date,
    todayLabel: string,
    yesterdayLabel: string
): string {
    const date = new Date(value);
    const now = new Date();
    const startOfDay = (d: Date) =>
        new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const dayDiff = Math.round(
        (startOfDay(now) - startOfDay(date)) / 86_400_000
    );
    if (dayDiff === 0) return todayLabel;
    if (dayDiff === 1) return yesterdayLabel;

    const locale = LOCALE_MAP[i18n.language] ?? "en-US";
    return new Intl.DateTimeFormat(locale, {
        day: "numeric",
        month: "long",
        year: date.getFullYear() === now.getFullYear() ? undefined : "numeric",
    }).format(date);
}

export function formatRideDate(date: Date, atLabel: string): string {
    const locale = LOCALE_MAP[i18n.language] ?? "en-US";
    const datePart = new Intl.DateTimeFormat(locale, {
        day: "numeric",
        month: "long",
    }).format(date);
    const timePart = new Intl.DateTimeFormat(locale, {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    }).format(date);
    return `${datePart} ${atLabel} ${timePart}`;
}
