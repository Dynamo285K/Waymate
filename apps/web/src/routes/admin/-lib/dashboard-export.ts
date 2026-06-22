import type { AdminDashboardResponse } from "../../../api-client/model/adminDashboardResponse";

/** Builds the plain-text dashboard report and triggers a browser download. */
export function downloadDashboardReport(dashboard: AdminDashboardResponse) {
    const lines = [
        `Dashboard Export — ${new Date().toLocaleDateString()}`,
        "",
        "=== User Metrics ===",
        `Total Registered: ${dashboard.userMetrics.totalRegistered}`,
        `Active (24h): ${dashboard.userMetrics.activeInLast24h}`,
        `Drivers: ${dashboard.userMetrics.drivers}`,
        `Passengers: ${dashboard.userMetrics.passengers}`,
        `Pending Verification: ${dashboard.userMetrics.pendingVerification}`,
        `Banned: ${dashboard.userMetrics.bannedAccounts}`,
        "",
        "=== Popular Routes ===",
        ...dashboard.popularRoutes.map(
            (r) => `${r.originCity} → ${r.destinationCity}: ${r.count} rides`
        ),
        "",
        "=== Weekly Rides ===",
        ...dashboard.weeklyRides.map((r) => `${r.date}: ${r.count}`),
        "",
        "=== Weekly Revenue (EUR) ===",
        ...dashboard.weeklyRevenue.map(
            (r) => `${r.date}: ${r.totalCents.toFixed(2)} EUR`
        ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dashboard-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
}
