// Shared car-color catalog: used by the Add Car form and the Ride Creation
// manual-car / saved-car sections, so all three render the same set of
// colors from a single source of truth.
export const COLORS = [
    { value: "WHITE", hex: "#f8fafc", border: "#cbd5e1" },
    { value: "BLACK", hex: "#000000", border: "#000000" },
    { value: "SILVER", hex: "#c0c0c0", border: "#c0c0c0" },
    { value: "GRAY", hex: "#6b7280", border: "#6b7280" },
    { value: "RED", hex: "#dc2626", border: "#dc2626" },
    { value: "BLUE", hex: "#2563eb", border: "#2563eb" },
    { value: "BROWN", hex: "#92400e", border: "#92400e" },
    { value: "GREEN", hex: "#16a34a", border: "#16a34a" },
    { value: "YELLOW", hex: "#eab308", border: "#eab308" },
    { value: "ORANGE", hex: "#ea580c", border: "#ea580c" },
    { value: "OTHER", hex: "#ffffff", border: "#94a3b8" },
] as const;

export type CarColor = (typeof COLORS)[number]["value"];

export const CAR_COLORS = COLORS.map((c) => c.value) as [
    CarColor,
    ...CarColor[],
];

/** i18n key (under the `carColor` namespace) for a color's display label. */
export function getCarColorI18nKey(color: CarColor | null | undefined) {
    return color ? (`carColor.${color}` as const) : undefined;
}
