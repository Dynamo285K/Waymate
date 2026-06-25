import { describe, expect, it, vi } from "vitest";
import { eq, inArray } from "drizzle-orm";
import { db } from "../../../db";
import { sessions, users, rides, bookings, rideStatusHistory, bookingStatusHistory } from "../../../db/schema";
import { AdminUserService } from "./admin-user.service";
import { createRideContext } from "../../../../test/factories";
import { BookingService } from "../../bookings/booking.service";

vi.mock("../../rides/eta/osrm.service", () => ({
    fetchOsrmRouteCells: vi
        .fn()
        .mockResolvedValue({ cells: [], durations: [3600] }),
}));

async function insertAdminUser() {
    const [user] = await db
        .insert(users)
        .values({
            name: "Admin User",
            email: `admin-${crypto.randomUUID()}@example.com`,
            emailVerified: true,
            firstName: "Admin",
            lastName: "User",
            phone: "+421900000001",
            userRole: "ADMIN",
        })
        .returning();

    if (!user) throw new Error("Failed to insert admin user");
    return user;
}

async function insertRegularUser(
    overrides: Partial<typeof users.$inferInsert> = {}
) {
    const [user] = await db
        .insert(users)
        .values({
            name: overrides.name ?? "Regular User",
            email:
                overrides.email ?? `regular-${crypto.randomUUID()}@example.com`,
            emailVerified: overrides.emailVerified ?? true,
            firstName: overrides.firstName ?? "Regular",
            lastName: overrides.lastName ?? "User",
            phone: overrides.phone ?? "+421900000002",
            userStatus: overrides.userStatus ?? "ACTIVE",
            banned: overrides.banned ?? false,
            banReason: overrides.banReason ?? null,
            banExpires: overrides.banExpires ?? null,
        })
        .returning();

    if (!user) throw new Error("Failed to insert regular user");
    return user;
}

async function insertSession(userId: string) {
    const [session] = await db
        .insert(sessions)
        .values({
            id: crypto.randomUUID(),
            userId,
            token: crypto.randomUUID(),
            expiresAt: new Date(Date.now() + 60 * 60 * 1000),
            createdAt: new Date(),
            updatedAt: new Date(),
        })
        .returning();

    if (!session) throw new Error("Failed to insert session");
    return session;
}

describe("AdminUserService.setUserStatus", () => {
    it("syncs a BANNED status to better-auth ban fields and clears sessions", async () => {
        const admin = await insertAdminUser();
        const target = await insertRegularUser();
        await insertSession(target.id);

        await AdminUserService.setUserStatus({
            actorId: admin.id,
            targetUserId: target.id,
            newStatus: "BANNED",
            reason: "Policy violation",
        });

        const [updated] = await db
            .select({
                userStatus: users.userStatus,
                banned: users.banned,
                banReason: users.banReason,
                banExpires: users.banExpires,
            })
            .from(users)
            .where(eq(users.id, target.id));

        expect(updated).toEqual({
            userStatus: "BANNED",
            banned: true,
            banReason: "Policy violation",
            banExpires: null,
        });

        const remainingSessions = await db
            .select({ id: sessions.id })
            .from(sessions)
            .where(eq(sessions.userId, target.id));
        expect(remainingSessions).toEqual([]);
    });

    it("clears better-auth ban fields when a banned user is reactivated", async () => {
        const admin = await insertAdminUser();
        const target = await insertRegularUser({
            userStatus: "BANNED",
            banned: true,
            banReason: "Old ban",
            banExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });

        await AdminUserService.setUserStatus({
            actorId: admin.id,
            targetUserId: target.id,
            newStatus: "ACTIVE",
        });

        const [updated] = await db
            .select({
                userStatus: users.userStatus,
                banned: users.banned,
                banReason: users.banReason,
                banExpires: users.banExpires,
            })
            .from(users)
            .where(eq(users.id, target.id));

        expect(updated).toEqual({
            userStatus: "ACTIVE",
            banned: false,
            banReason: null,
            banExpires: null,
        });
    });

    it("cascade cancels active rides and bookings when a user is banned", async () => {
        const admin = await insertAdminUser();

        // 1. Create a ride where the target user is the driver, and someone else is a passenger.
        const driverContext = await createRideContext({ withPassenger: true });
        const driverId = driverContext.driver.id;
        const driverRideId = driverContext.rideId;
        const passengerABookingId = driverContext.bookingId!;

        // 2. Create another ride where someone else is the driver, and our target user is a passenger.
        const otherDriverContext = await createRideContext();
        const otherRideId = otherDriverContext.rideId;
        const targetUserBookingId = await BookingService.createBookingRequest({
            rideId: otherRideId,
            passengerId: driverId,
            pickupStopId: otherDriverContext.pickupStopId,
            dropoffStopId: otherDriverContext.dropoffStopId,
            seatCount: 1,
        });
        await BookingService.confirmBooking(targetUserBookingId, otherDriverContext.driver.id);

        // 3. Admin bans the target user (driverId)
        await AdminUserService.setUserStatus({
            actorId: admin.id,
            targetUserId: driverId,
            newStatus: "BANNED",
            reason: "Violation of terms",
        });

        // 4. Assert driver's own ride is cancelled
        const [cancelledRide] = await db
            .select({ status: rides.rideStatus })
            .from(rides)
            .where(eq(rides.id, driverRideId));
        expect(cancelledRide?.status).toBe("CANCELLED");

        // Assert passenger A's booking on driver's ride is cancelled
        const [cancelledPassengerABooking] = await db
            .select({ status: bookings.bookingStatus })
            .from(bookings)
            .where(eq(bookings.id, passengerABookingId));
        expect(cancelledPassengerABooking?.status).toBe("CANCELLED");

        // Assert target user's booking on someone else's ride is cancelled
        const [cancelledTargetBooking] = await db
            .select({ status: bookings.bookingStatus })
            .from(bookings)
            .where(eq(bookings.id, targetUserBookingId));
        expect(cancelledTargetBooking?.status).toBe("CANCELLED");

        // 5. Assert history records are created with the correct reason
        const rideHistory = await db
            .select()
            .from(rideStatusHistory)
            .where(eq(rideStatusHistory.rideId, driverRideId));
        const cancelRideHistory = rideHistory.find((h) => h.newStatus === "CANCELLED");
        expect(cancelRideHistory?.reason).toBe("User account was banned by admin");

        const passengerABookingHistory = await db
            .select()
            .from(bookingStatusHistory)
            .where(eq(bookingStatusHistory.bookingId, passengerABookingId));
        const cancelPassengerABookingHistory = passengerABookingHistory.find((h) => h.newStatus === "CANCELLED");
        expect(cancelPassengerABookingHistory?.reason).toBe("User account was banned by admin");

        const targetBookingHistory = await db
            .select()
            .from(bookingStatusHistory)
            .where(eq(bookingStatusHistory.bookingId, targetUserBookingId));
        const cancelTargetBookingHistory = targetBookingHistory.find((h) => h.newStatus === "CANCELLED");
        expect(cancelTargetBookingHistory?.reason).toBe("User account was banned by admin");
    });
});
