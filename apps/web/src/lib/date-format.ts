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
