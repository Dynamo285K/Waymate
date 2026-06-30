import { describe, it, expect, vi } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "../../db";
import { rides as ridesTable, users as usersTable } from "../../db/schema";
import { StatisticsService } from "./statistics.service";
import { BookingService } from "../bookings/booking.service";
import { createRideContext, createTestCar } from "../../../test/factories";
import { createSignedInUser } from "../../../test/auth-helpers";

// Avoid the real OSRM network call during ride creation — keeps ride setup fast
// and deterministic (and off the shared DB pool long enough to race resets).
vi.mock("../rides/eta/osrm.service", () => ({
    fetchOsrmRouteCells: vi
        .fn()
        .mockResolvedValue({ cells: [], durations: [3600] }),
}));

// resetDatabase() truncates every domain table before each test (re-seeding only
// cities + car_models), so the DB starts empty and these totals are exact.

const todayKey = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

describe("StatisticsService.getDashboard — empty database", () => {
    it("returns empty series and zeroed metrics", async () => {
        const dash = await StatisticsService.getDashboard();

        expect(dash.weeklyRides).toEqual([]);
        expect(dash.weeklyRevenue).toEqual([]);
        expect(dash.popularRoutes).toEqual([]);
        expect(dash.userMetrics).toEqual({
            totalRegistered: 0,
            activeInLast24h: 0,
            pendingVerification: 0,
            bannedAccounts: 0,
            drivers: 0,
            passengers: 0,
        });
    });
});

describe("StatisticsService.getDashboard — aggregation", () => {
    it("counts weekly rides, sums revenue, and ranks popular routes", async () => {
        // Two rides today, each Bratislava → Trnava with a CONFIRMED booking of
        // 1500 cents (the factory default price).
        await createRideContext({ withPassenger: true });
        await createRideContext({ withPassenger: true });

        const dash = await StatisticsService.getDashboard();

        // Weekly rides: both created today.
        const ridesToday = dash.weeklyRides.find((r) => r.date === todayKey());
        expect(ridesToday?.count).toBe(2);
        expect(dash.weeklyRides.reduce((s, r) => s + r.count, 0)).toBe(2);

        // Weekly revenue: 2 × 1500 confirmed cents, all today.
        const revenueToday = dash.weeklyRevenue.find(
            (r) => r.date === todayKey()
        );
        expect(revenueToday?.totalCents).toBe(3000);

        // Popular routes: both rides share the same origin/destination cities.
        expect(dash.popularRoutes[0]).toMatchObject({
            originCity: "Bratislava",
            destinationCity: "Trnava",
            count: 2,
        });
    });

    it("computes user metrics: drivers = distinct car owners, passengers = rest", async () => {
        // ctx creates a driver (owns a car) + a passenger (no car). Add one more
        // car-less user to widen the passenger side.
        await createRideContext({ withPassenger: true });
        await createSignedInUser();

        const dash = await StatisticsService.getDashboard();

        expect(dash.userMetrics.totalRegistered).toBe(3);
        expect(dash.userMetrics.drivers).toBe(1); // only the ride driver owns a car
        expect(dash.userMetrics.passengers).toBe(2); // 3 total − 1 driver
        expect(dash.userMetrics.bannedAccounts).toBe(0);
    });

    it("counts a user who owns a car as a driver even without a ride", async () => {
        const owner = await createSignedInUser();
        await createTestCar(owner.user.id);

        const dash = await StatisticsService.getDashboard();

        expect(dash.userMetrics.drivers).toBe(1);
        expect(dash.userMetrics.totalRegistered).toBe(1);
        expect(dash.userMetrics.passengers).toBe(0);
    });

    it("counts banned accounts", async () => {
        const u = await createSignedInUser();
        await db
            .update(usersTable)
            .set({ userStatus: "BANNED", banned: true })
            .where(eq(usersTable.id, u.user.id));

        const dash = await StatisticsService.getDashboard();

        expect(dash.userMetrics.bannedAccounts).toBe(1);
    });
});

describe("StatisticsService.getDashboard — filtering", () => {
    it("excludes non-CONFIRMED/COMPLETED bookings from revenue", async () => {
        const ctx = await createRideContext({ withPassenger: true });

        // Add a second passenger with a PENDING (unconfirmed) booking on the same
        // ride — it must not contribute to revenue.
        const pending = await createSignedInUser();
        await BookingService.createBookingRequest({
            rideId: ctx.rideId,
            passengerId: pending.user.id,
            pickupStopId: ctx.pickupStopId,
            dropoffStopId: ctx.dropoffStopId,
            seatCount: 1,
        });

        const dash = await StatisticsService.getDashboard();

        const revenueToday = dash.weeklyRevenue.find(
            (r) => r.date === todayKey()
        );
        // Only the single CONFIRMED 1500 booking counts, not the PENDING one.
        expect(revenueToday?.totalCents).toBe(1500);
    });

    it("excludes rides created more than 7 days ago from the weekly series", async () => {
        const ctx = await createRideContext({ withPassenger: true });

        // Backdate the ride's createdAt beyond the 7-day window.
        const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
        await db
            .update(ridesTable)
            .set({ createdAt: eightDaysAgo })
            .where(eq(ridesTable.id, ctx.rideId));

        const dash = await StatisticsService.getDashboard();

        expect(dash.weeklyRides).toEqual([]);
    });
});
