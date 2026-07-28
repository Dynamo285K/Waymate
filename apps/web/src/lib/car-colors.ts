// Shared car-color catalog: used by the Add Car form and the Ride Creation
// manual-car / saved-car sections, so all three render the same set of
// colors from a single source of truth.
export const COLORS = [
    { value: "WHITE", label: "White", hex: "#f8fafc", border: "#cbd5e1" },
    { value: "BLACK", label: "Black", hex: "#000000", border: "#000000" },
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

export const CAR_COLORS = COLORS.map((c) => c.value) as [
    CarColor,
    ...CarColor[],
];

export function getCarColorLabel(color: CarColor | null | undefined) {
    return COLORS.find((c) => c.value === color)?.label;
}
