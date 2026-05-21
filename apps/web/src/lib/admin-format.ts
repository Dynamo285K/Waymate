import i18n from "../i18n";

const LOCALE_MAP: Record<string, string> = {
    en: "en-US",
    sk: "sk-SK",
    cs: "cs-CZ",
};

export function fullName(
    firstName: string | null | undefined,
    lastName: string | null | undefined
): string {
    return [firstName, lastName].filter(Boolean).join(" ");
}

export function formatDate(
    value: string | null | undefined,
    fallback: string
): string {
    if (!value) return fallback;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return fallback;
    const locale = LOCALE_MAP[i18n.language] ?? "en-US";
    return new Intl.DateTimeFormat(locale, {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    }).format(date);
}

export function formatPrice(amount: number, currency: string): string {
    const locale = LOCALE_MAP[i18n.language] ?? "en-US";
    try {
        return new Intl.NumberFormat(locale, {
            style: "currency",
            currency,
            maximumFractionDigits: 0,
        }).format(amount);
    } catch {
        return `${amount} ${currency}`;
    }
}
