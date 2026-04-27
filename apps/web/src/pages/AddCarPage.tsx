import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useLocation } from "../lib/router-compat";
import { PassengerNavbar, DriverNavbar, Button } from "waymate-ui";
import type { Language } from "waymate-ui";
import { useDriverNavbarProps } from "../hooks/useDriverNavbarProps";
import { api } from "../lib/eden";
import { unwrap } from "../lib/eden-query";

type AddCarPageProps = {
    language: Language;
    theme: "light" | "dark";
    onLanguageChange: (lang: Language) => void;
    onThemeToggle: () => void;
    userName?: string;
    userEmail?: string;
};

const FALLBACK_CAR_MAKES = [
    "Škoda",
    "Volkswagen",
    "BMW",
    "Audi",
    "Toyota",
    "Ford",
    "Hyundai",
    "Kia",
    "Renault",
    "Peugeot",
    "Seat",
    "Honda",
    "Volvo",
    "Mercedes-Benz",
    "Opel",
];

const CAR_MODELS: Record<string, string[]> = {
    Škoda: ["Octavia", "Fabia", "Superb", "Kodiaq", "Karoq", "Scala"],
    Volkswagen: ["Golf", "Passat", "Polo", "Tiguan", "T-Roc"],
    BMW: ["1 Series", "3 Series", "5 Series", "X1", "X3", "X5"],
    Audi: ["A3", "A4", "A6", "Q3", "Q5", "Q7"],
    Toyota: ["Corolla", "Yaris", "RAV4", "Camry", "C-HR"],
    Ford: ["Focus", "Fiesta", "Mondeo", "Kuga", "Mustang"],
    Hyundai: ["i20", "i30", "Tucson", "Santa Fe"],
    Kia: ["Ceed", "Sportage", "Sorento", "Stonic"],
    Renault: ["Clio", "Megane", "Kadjar", "Captur"],
    Peugeot: ["208", "308", "3008", "5008"],
    Seat: ["Ibiza", "Leon", "Arona", "Ateca"],
    Honda: ["Civic", "Jazz", "CR-V", "HR-V"],
    Volvo: ["V40", "V60", "XC40", "XC60", "XC90"],
    "Mercedes-Benz": ["A-Class", "C-Class", "E-Class", "GLA", "GLC"],
    Opel: ["Astra", "Corsa", "Insignia", "Crossland"],
};

const COLORS = [
    { name: "White", hex: "#f5f5f5", border: "#d1d5db" },
    { name: "Silver", hex: "#c0c0c0", border: "#c0c0c0" },
    { name: "Black", hex: "#1f2937", border: "#1f2937" },
    { name: "Gray", hex: "#6b7280", border: "#6b7280" },
    { name: "Red", hex: "#dc2626", border: "#dc2626" },
    { name: "Blue", hex: "#2563eb", border: "#2563eb" },
    { name: "Green", hex: "#16a34a", border: "#16a34a" },
    { name: "Orange", hex: "#ea580c", border: "#ea580c" },
    { name: "Beige", hex: "#d4b896", border: "#d4b896" },
    { name: "Brown", hex: "#92400e", border: "#92400e" },
];

export function AddCarPage({
    language,
    theme,
    onLanguageChange,
    onThemeToggle,
    userName,
    userEmail,
}: AddCarPageProps) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const role =
        (location.state as { role?: "passenger" | "driver" } | null)?.role ??
        "driver";
    const backPath =
        role === "driver" ? "/driver/profile" : "/passenger/profile";

    const [make, setMake] = useState("");
    const [model, setModel] = useState("");
    const [seats, setSeats] = useState<number | null>(null);
    const [color, setColor] = useState<string | null>(null);
    const [plate, setPlate] = useState("");

    const brandsQuery = useQuery({
        queryKey: ["cars", "brands"],
        queryFn: () => unwrap(api.cars.brands.get()),
    });
    const carMakes =
        brandsQuery.data?.map((row) => row.brand) ?? FALLBACK_CAR_MAKES;

    const driverNavbarProps = useDriverNavbarProps({
        language,
        onLanguageChange,
        theme,
        onThemeToggle,
        userName,
        userEmail,
    });

    const inputClass =
        "w-full rounded-xl border border-(--color-border) bg-(--color-input-bg) text-(--color-text-primary) px-3 py-3 text-sm outline-none focus:border-(--color-primary) focus:ring-2 focus:ring-green-100 transition-colors font-[Inter,sans-serif] appearance-none";
    const labelClass =
        "text-sm font-bold text-(--color-text-primary) mb-1 block";

    return (
        <div
            data-theme={theme}
            className="min-h-screen bg-(--color-bg)"
        >
            {role === "driver" ? (
                <DriverNavbar {...driverNavbarProps} />
            ) : (
                <PassengerNavbar
                    activeTab="find-ride"
                    language={language}
                    onLanguageChange={onLanguageChange}
                    role="passenger"
                    onRoleChange={(r) => r === "driver" && navigate("/driver")}
                    theme={theme}
                    onThemeToggle={onThemeToggle}
                    userName={userName}
                    userEmail={userEmail}
                    onLogoClick={() => navigate("/passenger")}
                    onFindRideClick={() => navigate("/passenger")}
                    onMyRidesClick={() => navigate("/passenger/rides")}
                    onChatClick={() => navigate("/passenger/chat")}
                    onLogoutClick={() => navigate("/")}
                />
            )}

            <section className="w-full px-4 sm:max-w-2xl sm:mx-auto sm:px-8 py-8 sm:py-12">
                <button
                    onClick={() => navigate(backPath)}
                    className="text-(--color-text-secondary) text-sm mb-6 hover:text-(--color-text-primary) transition-colors"
                >
                    {t("profile.backToProfile", "← Back to My Profile")}
                </button>
                <h1 className="text-2xl font-bold text-(--color-text-primary) mb-8">
                    {t("addCar.title", "Add car")}
                </h1>

                <div className="bg-(--color-card) rounded-2xl border border-(--color-border) overflow-hidden">
                    {/* Make & Model */}
                    <div className="p-6 border-b border-(--color-border)">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>
                                    {t("addCar.make", "Make")}{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <select
                                        className={
                                            inputClass + " pr-10 cursor-pointer"
                                        }
                                        value={make}
                                        onChange={(e) => {
                                            setMake(e.target.value);
                                            setModel("");
                                        }}
                                    >
                                        <option value="">
                                            {t(
                                                "addCar.selectMake",
                                                "Select make..."
                                            )}
                                        </option>
                                        {carMakes.map((m) => (
                                            <option
                                                key={m}
                                                value={m}
                                            >
                                                {m}
                                            </option>
                                        ))}
                                    </select>
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-(--color-text-secondary)">
                                        ▾
                                    </span>
                                </div>
                            </div>
                            <div>
                                <label className={labelClass}>
                                    {t("addCar.model", "Model")}{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <select
                                        className={
                                            inputClass +
                                            " pr-10 cursor-pointer disabled:opacity-50"
                                        }
                                        value={model}
                                        onChange={(e) =>
                                            setModel(e.target.value)
                                        }
                                        disabled={!make}
                                    >
                                        <option value="">
                                            {t(
                                                "addCar.selectModel",
                                                "Select model..."
                                            )}
                                        </option>
                                        {(CAR_MODELS[make] ?? []).map((m) => (
                                            <option
                                                key={m}
                                                value={m}
                                            >
                                                {m}
                                            </option>
                                        ))}
                                    </select>
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-(--color-text-secondary)">
                                        ▾
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Seats */}
                    <div className="p-6 border-b border-(--color-border)">
                        <label className={labelClass}>
                            {t("addCar.seats", "Available passenger seats")}{" "}
                            <span className="text-red-500">*</span>
                            <span className="font-normal text-(--color-text-secondary) ml-2">
                                {t(
                                    "addCar.excludingDriver",
                                    "(excluding driver)"
                                )}
                            </span>
                        </label>
                        <div className="flex gap-2 mt-3 flex-wrap">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                                <button
                                    key={n}
                                    type="button"
                                    onClick={() => setSeats(n)}
                                    className={`w-12 h-12 rounded-xl border-2 font-semibold text-sm transition-all ${
                                        seats === n
                                            ? "border-(--color-primary) bg-green-50 text-(--color-primary)"
                                            : "border-(--color-border) bg-(--color-card) text-(--color-text-primary) hover:border-(--color-primary)"
                                    }`}
                                >
                                    {n}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Color */}
                    <div className="p-6 border-b border-(--color-border)">
                        <label className={labelClass}>
                            {t("addCar.color", "Color")}
                            <span className="font-normal text-(--color-text-secondary) ml-2">
                                {t("addCar.optional", "(optional)")}
                            </span>
                        </label>
                        <div className="flex gap-3 mt-3 flex-wrap">
                            {COLORS.map((c) => (
                                <button
                                    key={c.name}
                                    type="button"
                                    onClick={() => setColor(c.name)}
                                    className="flex flex-col items-center gap-1"
                                >
                                    <span
                                        className={`w-10 h-10 rounded-full transition-all ${color === c.name ? "ring-2 ring-offset-2 ring-(--color-primary) scale-110" : ""}`}
                                        style={{
                                            backgroundColor: c.hex,
                                            border: `1.5px solid ${c.border}`,
                                        }}
                                    />
                                    <span className="text-xs text-(--color-text-secondary)">
                                        {c.name}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* License plate */}
                    <div className="p-6 border-b border-(--color-border)">
                        <label className={labelClass}>
                            {t("addCar.licensePlate", "License plate (ŠPZ)")}{" "}
                            <span className="text-red-500">*</span>
                        </label>
                        <div className="flex gap-2 mt-1 items-center">
                            <div className="flex-shrink-0 w-16 h-12 rounded-xl bg-slate-800 flex flex-col items-center justify-center text-white text-xs font-bold">
                                <span className="text-yellow-300 tracking-widest text-[10px]">
                                    ★ ★ ★
                                </span>
                                <span className="text-[11px] mt-0.5">SK</span>
                            </div>
                            <input
                                className={inputClass + " flex-1"}
                                placeholder="BA-123AB"
                                value={plate}
                                onChange={(e) =>
                                    setPlate(e.target.value.toUpperCase())
                                }
                                maxLength={10}
                            />
                        </div>
                        <p className="text-xs text-(--color-text-secondary) mt-1.5">
                            {t("addCar.format", "Format:")}{" "}
                            <span className="bg-(--color-border) px-1.5 py-0.5 rounded text-xs">
                                XX-000AA
                            </span>
                        </p>
                    </div>

                    {/* Action */}
                    <div className="p-6 flex justify-end">
                        <Button
                            variant="black"
                            onClick={() => navigate(backPath)}
                        >
                            ✓ {t("addCar.addButton", "Add car")}
                        </Button>
                    </div>
                </div>
            </section>
        </div>
    );
}
