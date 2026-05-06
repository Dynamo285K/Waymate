import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Avatar, Button, Modal } from "@waymate/ui";
import type { Language } from "../components/controls/LanguageSwitcher";
import { AdminNavbar } from "../components/navigation/AdminNavbar";
import { useAdminNavbarProps } from "../hooks/useAdminNavbarProps";

type AdminRidesPageProps = {
    language: Language;
    theme: "light" | "dark";
    onLanguageChange: (lang: Language) => void;
    onThemeToggle: () => void;
    userName?: string;
    userEmail?: string;
};

type RideStatus = "upcoming" | "completed" | "cancelled";

type Ride = {
    id: number;
    driver: string;
    from: string;
    to: string;
    date: string;
    time: string;
    seatsTaken: number;
    seatsTotal: number;
    price: number;
    status: RideStatus;
    passengers: string[];
};

const RIDES: Ride[] = [
    {
        id: 101,
        driver: "Martin Kováč",
        from: "Bratislava",
        to: "Brno",
        date: "25.4.2026",
        time: "08:00",
        seatsTaken: 2,
        seatsTotal: 3,
        price: 8,
        status: "upcoming",
        passengers: ["Jana Horáková", "Monika Červená"],
    },
    {
        id: 102,
        driver: "Eva Szabóová",
        from: "Martin",
        to: "Žilina",
        date: "25.4.2026",
        time: "09:30",
        seatsTaken: 4,
        seatsTotal: 4,
        price: 5,
        status: "upcoming",
        passengers: [
            "Peter Molnár",
            "Zuzana Novák",
            "Ján Horák",
            "Lucia Blaho",
        ],
    },
    {
        id: 103,
        driver: "Tomáš Varga",
        from: "Praha",
        to: "Brno",
        date: "24.4.2026",
        time: "14:00",
        seatsTaken: 3,
        seatsTotal: 3,
        price: 12,
        status: "completed",
        passengers: ["Anna Kováčová", "Miroslav Tóth", "Petra Blaho"],
    },
    {
        id: 104,
        driver: "Peter Novák",
        from: "Košice",
        to: "Bratislava",
        date: "22.4.2026",
        time: "06:00",
        seatsTaken: 1,
        seatsTotal: 2,
        price: 18,
        status: "cancelled",
        passengers: ["Róbert Šimko"],
    },
    {
        id: 105,
        driver: "Martin Kováč",
        from: "Brno",
        to: "Praha",
        date: "26.4.2026",
        time: "11:00",
        seatsTaken: 0,
        seatsTotal: 2,
        price: 11,
        status: "upcoming",
        passengers: [],
    },
    {
        id: 106,
        driver: "Tomáš Varga",
        from: "Žilina",
        to: "Bratislava",
        date: "23.4.2026",
        time: "16:00",
        seatsTaken: 2,
        seatsTotal: 3,
        price: 9,
        status: "completed",
        passengers: ["Karol Fekete", "Marta Lukáčová"],
    },
    {
        id: 107,
        driver: "Eva Szabóová",
        from: "Nitra",
        to: "Trenčín",
        date: "20.4.2026",
        time: "07:30",
        seatsTaken: 1,
        seatsTotal: 4,
        price: 6,
        status: "cancelled",
        passengers: ["Vladimír Horváth"],
    },
];

function StatusBadge({ status }: { status: RideStatus }) {
    const { t } = useTranslation();
    const styles: Record<RideStatus, string> = {
        upcoming:
            "border border-(--color-success-border) text-(--color-success-text) bg-(--color-success-bg)",
        completed: "bg-(--color-secondary-hover) text-(--color-text-secondary)",
        cancelled:
            "border border-(--color-danger-border) bg-(--color-danger-bg) text-(--color-danger-text)",
    };
    const labels: Record<RideStatus, string> = {
        upcoming: t("admin.upcoming"),
        completed: t("admin.completed"),
        cancelled: t("admin.cancelled"),
    };
    return (
        <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${styles[status]}`}
        >
            {labels[status]}
        </span>
    );
}

function RideModal({
    ride,
    onClose,
    onForceCancel,
}: {
    ride: Ride;
    onClose: () => void;
    onForceCancel: (id: number) => void;
}) {
    const { t } = useTranslation();
    return (
        <Modal
            open={true}
            onClose={onClose}
        >
            <div className="w-[calc(100vw-2rem)] max-w-lg p-8">
                <div className="flex justify-between items-start mb-6">
                    <h2 className="text-xl font-bold text-(--color-text-primary)">
                        {t("admin.rideTitle", {
                            id: ride.id,
                            from: ride.from,
                            to: ride.to,
                        })}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-(--color-text-secondary) hover:text-(--color-text-primary) text-xl leading-none"
                    >
                        ✕
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-6">
                    {[
                        [t("admin.driver"), ride.driver],
                        [t("admin.date"), ride.date],
                        [t("admin.time"), ride.time],
                        [t("admin.price"), `${ride.price}€`],
                        [
                            t("admin.seats"),
                            t("admin.seatsTaken", {
                                taken: ride.seatsTaken,
                                total: ride.seatsTotal,
                            }),
                        ],
                        [
                            t("admin.status"),
                            <StatusBadge
                                key="s"
                                status={ride.status}
                            />,
                        ],
                    ].map(([label, value]) => (
                        <div key={String(label)}>
                            <p className="text-xs font-bold text-(--color-text-secondary) tracking-wider mb-1">
                                {String(label)}
                            </p>
                            <div className="text-sm font-semibold text-(--color-text-primary)">
                                {value}
                            </div>
                        </div>
                    ))}
                </div>

                {ride.passengers.length > 0 && (
                    <div className="mb-5">
                        <p className="text-xs font-bold text-(--color-text-secondary) tracking-wider mb-3">
                            {t("admin.confirmedPassengers", {
                                count: ride.passengers.length,
                            })}
                        </p>
                        <div className="flex flex-col gap-2">
                            {ride.passengers.map((p) => (
                                <div
                                    key={p}
                                    className="flex items-center gap-2"
                                >
                                    <Avatar
                                        name={p}
                                        size="sm"
                                    />
                                    <span className="text-sm text-(--color-text-primary)">
                                        {p}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="bg-(--color-success-bg) border border-(--color-success-border) rounded-xl p-3 mb-6 text-sm text-(--color-success-text)">
                    <span className="font-bold">{t("admin.adminNote")}: </span>
                    {t("admin.adminNoteText")}
                </div>

                <div className="flex gap-3 justify-end">
                    <Button
                        variant="secondary"
                        onClick={onClose}
                    >
                        {t("admin.close")}
                    </Button>
                    {ride.status === "upcoming" && (
                        <Button
                            variant="red"
                            onClick={() => {
                                onForceCancel(ride.id);
                                onClose();
                            }}
                        >
                            ✕ {t("admin.forceCancel")}
                        </Button>
                    )}
                </div>
            </div>
        </Modal>
    );
}

function ModifyRideModal({
    ride,
    onClose,
    onSave,
}: {
    ride: Ride;
    onClose: () => void;
    onSave: (id: number, data: Partial<Ride>) => void;
}) {
    const { t } = useTranslation();
    const [from, setFrom] = useState(ride.from);
    const [to, setTo] = useState(ride.to);
    const [date, setDate] = useState(ride.date);
    const [time, setTime] = useState(ride.time);

    const inputClass =
        "w-full border border-(--color-border) rounded-xl bg-(--color-input-bg) text-(--color-text-primary) px-4 py-3 text-sm outline-none focus:border-(--color-primary) transition-colors";
    const labelClass =
        "text-sm font-semibold text-(--color-text-primary) mb-1.5 block";

    return (
        <Modal
            open={true}
            onClose={onClose}
        >
            <div className="w-[calc(100vw-2rem)] max-w-lg p-8">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-(--color-text-primary)">
                        {t("admin.modifyRide", { id: ride.id })}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-(--color-text-secondary) hover:text-(--color-text-primary) text-xl leading-none"
                    >
                        ✕
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                        <label className={labelClass}>{t("admin.from")}</label>
                        <input
                            className={inputClass}
                            value={from}
                            onChange={(e) => setFrom(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className={labelClass}>{t("admin.to")}</label>
                        <input
                            className={inputClass}
                            value={to}
                            onChange={(e) => setTo(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className={labelClass}>{t("admin.date")}</label>
                        <input
                            className={inputClass}
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className={labelClass}>{t("admin.time")}</label>
                        <input
                            className={inputClass}
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex gap-3 justify-end">
                    <Button
                        variant="secondary"
                        onClick={onClose}
                    >
                        {t("admin.cancel")}
                    </Button>
                    <Button
                        onClick={() => {
                            onSave(ride.id, { from, to, date, time });
                            onClose();
                        }}
                    >
                        {t("admin.saveChanges")}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}

export function AdminRidesPage({
    language,
    theme,
    onLanguageChange,
    onThemeToggle,
    userName,
    userEmail,
}: AdminRidesPageProps) {
    const { t } = useTranslation();
    const navbarProps = useAdminNavbarProps({
        activeTab: "rides",
        language,
        onLanguageChange,
        theme,
        onThemeToggle,
        userName,
        userEmail,
    });
    const [filter, setFilter] = useState<"all" | RideStatus>("all");
    const [search, setSearch] = useState("");
    const [viewRide, setViewRide] = useState<Ride | null>(null);
    const [editRide, setEditRide] = useState<Ride | null>(null);
    const [rides, setRides] = useState(RIDES);

    const filtered = rides.filter((r) => {
        const matchFilter = filter === "all" || r.status === filter;
        const q = search.toLowerCase();
        const matchSearch =
            !q ||
            r.driver.toLowerCase().includes(q) ||
            r.from.toLowerCase().includes(q) ||
            r.to.toLowerCase().includes(q);
        return matchFilter && matchSearch;
    });

    function handleForceCancel(id: number) {
        setRides((prev) =>
            prev.map((r) =>
                r.id === id ? { ...r, status: "cancelled" as RideStatus } : r
            )
        );
    }

    function handleSaveRide(id: number, data: Partial<Ride>) {
        setRides((prev) =>
            prev.map((r) => (r.id === id ? { ...r, ...data } : r))
        );
    }

    const FILTERS: { key: "all" | RideStatus; label: string }[] = [
        { key: "all", label: t("admin.all") },
        { key: "upcoming", label: t("admin.upcoming") },
        { key: "completed", label: t("admin.completed") },
        { key: "cancelled", label: t("admin.cancelled") },
    ];

    return (
        <div
            data-theme={theme}
            className="min-h-screen bg-(--color-bg)"
        >
            <AdminNavbar {...navbarProps} />

            <div className="w-full px-4 sm:max-w-6xl sm:mx-auto sm:px-8 py-8">
                <h1 className="text-2xl font-bold text-(--color-text-primary)">
                    {t("admin.ridesTitle")}
                </h1>
                <p className="text-(--color-text-secondary) text-sm mt-1 mb-6">
                    {t("admin.ridesSubtitle")}
                </p>

                {/* Filters + Search */}
                <div className="flex flex-wrap gap-3 mb-6 items-center">
                    <div className="flex gap-2">
                        {FILTERS.map((f) => (
                            <button
                                key={f.key}
                                onClick={() => setFilter(f.key)}
                                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                                    filter === f.key
                                        ? "bg-(--color-text-primary) text-(--color-card)"
                                        : "text-(--color-text-secondary) hover:text-(--color-text-primary)"
                                }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-2 border border-(--color-border) rounded-xl px-3 py-2 bg-(--color-card) ml-auto min-w-55">
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className="text-(--color-text-secondary) shrink-0"
                        >
                            <circle
                                cx="11"
                                cy="11"
                                r="8"
                            />
                            <path d="m21 21-4.35-4.35" />
                        </svg>
                        <input
                            className="bg-transparent border-none outline-none text-sm text-(--color-text-primary) w-full"
                            placeholder={t("admin.searchRides")}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="bg-(--color-card) rounded-2xl border border-(--color-border) overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-(--color-border)">
                                {[
                                    "#",
                                    t("admin.driver"),
                                    t("admin.route"),
                                    t("admin.dateTime"),
                                    t("admin.seats"),
                                    t("admin.price"),
                                    t("admin.status"),
                                    t("admin.actions"),
                                ].map((h) => (
                                    <th
                                        key={h}
                                        className="text-left text-xs font-bold text-(--color-text-secondary) tracking-wider px-5 py-4"
                                    >
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((ride) => (
                                <tr
                                    key={ride.id}
                                    className="border-b border-(--color-border) last:border-0 hover:bg-(--color-bg) transition-colors"
                                >
                                    <td className="px-5 py-4 text-(--color-text-secondary)">
                                        {ride.id}
                                    </td>
                                    <td className="px-5 py-4 font-semibold text-(--color-text-primary) whitespace-nowrap">
                                        {ride.driver}
                                    </td>
                                    <td className="px-5 py-4 font-semibold text-(--color-text-primary) whitespace-nowrap">
                                        {ride.from} → {ride.to}
                                    </td>
                                    <td className="px-5 py-4 text-(--color-text-secondary) whitespace-nowrap">
                                        {ride.date} · {ride.time}
                                    </td>
                                    <td className="px-5 py-4 font-semibold text-(--color-text-primary)">
                                        <span
                                            className={
                                                ride.seatsTaken > 0
                                                    ? "text-(--color-success-text)"
                                                    : ""
                                            }
                                        >
                                            {ride.seatsTaken}
                                        </span>
                                        <span className="text-(--color-text-secondary)">
                                            /{ride.seatsTotal}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 font-semibold text-(--color-text-primary)">
                                        {ride.price}€
                                    </td>
                                    <td className="px-5 py-4">
                                        <StatusBadge status={ride.status} />
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex gap-2 items-center">
                                            <button
                                                onClick={() =>
                                                    setViewRide(ride)
                                                }
                                                className="px-3 py-1.5 border border-(--color-border) rounded-lg text-sm font-medium text-(--color-text-secondary) hover:bg-(--color-border) transition-colors whitespace-nowrap"
                                            >
                                                {t("admin.view")}
                                            </button>
                                            {ride.status === "upcoming" && (
                                                <>
                                                    <button
                                                        onClick={() =>
                                                            setEditRide(ride)
                                                        }
                                                        className="w-8 h-8 border border-(--color-border) rounded-lg flex items-center justify-center text-(--color-text-secondary) hover:bg-(--color-border) transition-colors"
                                                    >
                                                        <svg
                                                            width="14"
                                                            height="14"
                                                            viewBox="0 0 24 24"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            strokeWidth="2"
                                                        >
                                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            handleForceCancel(
                                                                ride.id
                                                            )
                                                        }
                                                        className="px-3 py-1.5 bg-(--color-red) hover:bg-(--color-red)/90 text-(--color-card) rounded-lg text-sm font-semibold transition-colors whitespace-nowrap"
                                                    >
                                                        {t("admin.forceCancel")}
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {viewRide && (
                <RideModal
                    ride={viewRide}
                    onClose={() => setViewRide(null)}
                    onForceCancel={handleForceCancel}
                />
            )}

            {editRide && (
                <ModifyRideModal
                    ride={editRide}
                    onClose={() => setEditRide(null)}
                    onSave={handleSaveRide}
                />
            )}
        </div>
    );
}
