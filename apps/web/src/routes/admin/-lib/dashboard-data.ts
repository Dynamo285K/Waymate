import type { AdminDashboardDayRides } from "../../../api-client/model/adminDashboardDayRides";
import type { AdminDashboardDayRevenue } from "../../../api-client/model/adminDashboardDayRevenue";

// The dashboard charts always show a fixed trailing 7-day window; the API only
// returns days that have data, so these helpers pad the gaps with zeroes.

function getLast7Days(): { date: string; dayLabel: string }[] {
    const days = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const dateStr = d.toISOString().slice(0, 10);
        const dayLabel = d
            .toLocaleDateString("en-US", { weekday: "short" })
            .slice(0, 2);
        days.push({ date: dateStr, dayLabel });
    }
    return days;
}

export function fillWeeklyRides(data: AdminDashboardDayRides[]) {
    const map = new Map(data.map((d) => [d.date, d.count]));
    return getLast7Days().map(({ date, dayLabel }) => ({
        day: dayLabel,
        rides: map.get(date) ?? 0,
    }));
}

export function fillWeeklyRevenue(data: AdminDashboardDayRevenue[]) {
    const map = new Map(data.map((d) => [d.date, d.totalCents]));
    return getLast7Days().map(({ date, dayLabel }) => ({
        day: dayLabel,
        eur: map.get(date) ?? 0,
    }));
}
