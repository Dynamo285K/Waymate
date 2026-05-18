import { describe, it, expect } from "vitest";
import { and, asc, eq } from "drizzle-orm";
import { db } from "../../db";
import {
    bookings as bookingsTable,
    carModels,
    cars,
    reports as reportsTable,
    reportStatusHistory,
    rides as ridesTable,
    rideStops,
    users,
} from "../../db/schema";
import { ReportService } from "./report.service";
import { ReportError, ReportErrorCodes } from "./report.errors";
import { RideService } from "../rides/ride.service";
import { BookingService } from "../bookings/booking.service";
import type { CreateRideBody } from "@repo/shared";

async function insertTestUser(
    overrides: Partial<typeof users.$inferInsert> = {}
) {
    const [user] = await db
        .insert(users)
        .values({
            name: overrides.name ?? "Test User",
            email: overrides.email ?? `test-${crypto.randomUUID()}@example.com`,
            userRole: overrides.userRole ?? "USER",
            deletedAt: overrides.deletedAt ?? null,
        })
        .returning();
    if (!user) throw new Error("Failed to insert test user");
    return user;
}

async function getAnyCarModelId(): Promise<number> {
    const [model] = await db.select().from(carModels).limit(1);
    if (!model) {
        throw new Error(
            "car_models is empty — reset-db.ts should reseed reference data"
        );
    }
    return model.id;
}

async function insertCarFor(ownerId: string) {
    const modelId = await getAnyCarModelId();
    const [car] = await db
        .insert(cars)
        .values({
            ownerId,
            modelId,
            spz: `P${crypto.randomUUID().slice(0, 6).toUpperCase()}`,
            countryCode: "SK",
            color: "BLUE",
            seatsTotal: 4,
            isActive: true,
        })
        .returning();
    if (!car) throw new Error("Failed to insert test car");
    return car;
}

function buildRideBody(
    carId: string,
    departureAt: Date
): CreateRideBody {
    return {
        carId,
        departureAt,
        arrivalEstimateAt: new Date(departureAt.getTime() + 60 * 60 * 1000),
        offeredSeats: 3,
        currency: "EUR",
        description: null,
        stops: [
            {
                address: "Hlavná 1",
                city: "Bratislava",
                countryCode: "SK",
                lat: 48.148,
                lng: 17.107,
                plannedArrivalAt: null,
                plannedDepartureAt: departureAt,
            },
            {
                address: "Námestie SNP 1",
                city: "Banská Bystrica",
                countryCode: "SK",
                lat: 48.736,
                lng: 19.146,
                plannedArrivalAt: new Date(
                    departureAt.getTime() + 2 * 60 * 60 * 1000
                ),
                plannedDepartureAt: null,
            },
        ],
        prices: [{ startStopOrder: 0, endStopOrder: 1, amount: 500 }],
    };
}

type SharedRideSetup = {
    driver: Awaited<ReturnType<typeof insertTestUser>>;
    passenger: Awaited<ReturnType<typeof insertTestUser>>;
    rideId: string;
    bookingId: string;
};

// Creates a ride where driver and passenger have a CONFIRMED booking — the
// minimum state that qualifies them for cross-reporting.
async function setupSharedRide(): Promise<SharedRideSetup> {
    const driver = await insertTestUser();
    const passenger = await insertTestUser();
    const car = await insertCarFor(driver.id);
    const departureAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const rideId = await RideService.createRide(
        driver.id,
        buildRideBody(car.id, departureAt)
    );
    const stops = await db
        .select({ id: rideStops.id, stopOrder: rideStops.stopOrder })
        .from(rideStops)
        .where(eq(rideStops.rideId, rideId))
        .orderBy(asc(rideStops.stopOrder));

    const bookingId = await BookingService.createBookingRequest({
        rideId,
        passengerId: passenger.id,
        pickupStopId: stops[0]!.id,
        dropoffStopId: stops[1]!.id,
        seatCount: 1,
    });
    await BookingService.confirmBooking(bookingId, driver.id);

    return { driver, passenger, rideId, bookingId };
}

describe("ReportService.submitReport", () => {
    it("throws SelfReportNotAllowed when reporter and target are the same user", async () => {
        const user = await insertTestUser();

        await expect(
            ReportService.submitReport({
                reporterId: user.id,
                targetUserId: user.id,
                reportType: "OTHER",
                description: "I'm reporting myself",
            })
        ).rejects.toMatchObject({
            code: ReportErrorCodes.SelfReportNotAllowed,
        });
    });

    it("throws TargetUserNotFound when the target id doesn't exist", async () => {
        const reporter = await insertTestUser();

        await expect(
            ReportService.submitReport({
                reporterId: reporter.id,
                targetUserId: crypto.randomUUID(),
                reportType: "INAPPROPRIATE_BEHAVIOR",
                description: "Wanted to report a ghost",
            })
        ).rejects.toMatchObject({
            code: ReportErrorCodes.TargetUserNotFound,
        });
    });

    it("treats an ADMIN target as TargetUserNotFound (admins are invisible)", async () => {
        const reporter = await insertTestUser();
        const admin = await insertTestUser({
            email: `admin-${crypto.randomUUID()}@example.com`,
            userRole: "ADMIN",
        });

        await expect(
            ReportService.submitReport({
                reporterId: reporter.id,
                targetUserId: admin.id,
                reportType: "OTHER",
                description: "Hidden target",
            })
        ).rejects.toMatchObject({
            code: ReportErrorCodes.TargetUserNotFound,
        });
    });

    it("treats a soft-deleted target as TargetUserNotFound", async () => {
        const reporter = await insertTestUser();
        const target = await insertTestUser({ deletedAt: new Date() });

        await expect(
            ReportService.submitReport({
                reporterId: reporter.id,
                targetUserId: target.id,
                reportType: "OTHER",
                description: "Target gone",
            })
        ).rejects.toMatchObject({
            code: ReportErrorCodes.TargetUserNotFound,
        });
    });

    it("throws RideNotFound when the supplied rideId doesn't exist", async () => {
        const { driver, passenger } = await setupSharedRide();

        await expect(
            ReportService.submitReport({
                reporterId: passenger.id,
                targetUserId: driver.id,
                rideId: crypto.randomUUID(),
                reportType: "SAFETY_ISSUE",
                description: "Linked to a missing ride",
            })
        ).rejects.toMatchObject({ code: ReportErrorCodes.RideNotFound });
    });

    it("throws TargetNotAllowed when reporter and target never shared a ride", async () => {
        const reporter = await insertTestUser();
        const target = await insertTestUser();

        await expect(
            ReportService.submitReport({
                reporterId: reporter.id,
                targetUserId: target.id,
                reportType: "OTHER",
                description: "Strangers can't report each other",
            })
        ).rejects.toMatchObject({ code: ReportErrorCodes.TargetNotAllowed });
    });

    it("throws TargetNotAllowed when the booking is still PENDING (not yet matched)", async () => {
        // Set up driver+passenger+ride+booking, but DON'T confirm it.
        const driver = await insertTestUser();
        const passenger = await insertTestUser();
        const car = await insertCarFor(driver.id);
        const rideId = await RideService.createRide(
            driver.id,
            buildRideBody(car.id, new Date(Date.now() + 24 * 60 * 60 * 1000))
        );
        const stops = await db
            .select({ id: rideStops.id, stopOrder: rideStops.stopOrder })
            .from(rideStops)
            .where(eq(rideStops.rideId, rideId))
            .orderBy(asc(rideStops.stopOrder));
        await BookingService.createBookingRequest({
            rideId,
            passengerId: passenger.id,
            pickupStopId: stops[0]!.id,
            dropoffStopId: stops[1]!.id,
            seatCount: 1,
        });

        await expect(
            ReportService.submitReport({
                reporterId: passenger.id,
                targetUserId: driver.id,
                reportType: "INAPPROPRIATE_BEHAVIOR",
                description: "PENDING shouldn't count",
            })
        ).rejects.toMatchObject({ code: ReportErrorCodes.TargetNotAllowed });
    });

    it("throws TargetNotAllowed when the only shared booking was CANCELLED", async () => {
        const { driver, passenger, bookingId } = await setupSharedRide();
        // Demote the active booking to CANCELLED so it no longer counts.
        await db
            .update(bookingsTable)
            .set({ bookingStatus: "CANCELLED" })
            .where(eq(bookingsTable.id, bookingId));

        await expect(
            ReportService.submitReport({
                reporterId: passenger.id,
                targetUserId: driver.id,
                reportType: "OTHER",
                description: "CANCELLED shouldn't count",
            })
        ).rejects.toMatchObject({ code: ReportErrorCodes.TargetNotAllowed });
    });

    it("lets a passenger report the driver on a CONFIRMED booking and writes a history row", async () => {
        const { driver, passenger, rideId } = await setupSharedRide();

        const report = await ReportService.submitReport({
            reporterId: passenger.id,
            targetUserId: driver.id,
            rideId,
            reportType: "SAFETY_ISSUE",
            description: "Driver was driving recklessly",
        });

        expect(report.reporterId).toBe(passenger.id);
        expect(report.targetUserId).toBe(driver.id);
        expect(report.rideId).toBe(rideId);
        expect(report.reportStatus).toBe("OPEN");

        const history = await db
            .select()
            .from(reportStatusHistory)
            .where(eq(reportStatusHistory.reportId, report.id));
        expect(history).toHaveLength(1);
        expect(history[0]!.newStatus).toBe("OPEN");
        expect(history[0]!.oldStatus).toBeNull();
        expect(history[0]!.changedByUserId).toBe(passenger.id);
    });

    it("lets a driver report a passenger when the booking later became COMPLETED", async () => {
        const { driver, passenger, bookingId } = await setupSharedRide();
        // COMPLETED also qualifies as an active shared ride.
        await db
            .update(bookingsTable)
            .set({ bookingStatus: "COMPLETED" })
            .where(eq(bookingsTable.id, bookingId));

        const report = await ReportService.submitReport({
            reporterId: driver.id,
            targetUserId: passenger.id,
            reportType: "NO_SHOW",
            description: "Passenger left luggage and walked off",
        });

        expect(report.reporterId).toBe(driver.id);
        expect(report.targetUserId).toBe(passenger.id);
        // rideId is optional and was not supplied — make sure it's null.
        expect(report.rideId).toBeNull();
    });

    it("does not insert a report row when validation fails (transaction rolls back)", async () => {
        // Use a setup that fails on the eligibility check inside the tx, then
        // verify no orphan rows leaked into the reports table.
        const reporter = await insertTestUser();
        const target = await insertTestUser();

        await expect(
            ReportService.submitReport({
                reporterId: reporter.id,
                targetUserId: target.id,
                reportType: "OTHER",
                description: "Should roll back",
            })
        ).rejects.toBeInstanceOf(ReportError);

        const leftover = await db
            .select()
            .from(reportsTable)
            .where(
                and(
                    eq(reportsTable.reporterId, reporter.id),
                    eq(reportsTable.targetUserId, target.id)
                )
            );
        expect(leftover).toEqual([]);
    });
});
