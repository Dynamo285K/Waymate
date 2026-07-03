import { describe, it, expect } from "vitest";
import { NotificationService } from "./notification.service";
import { BookingService } from "../bookings/booking.service";
import { RideService } from "../rides/ride.service";
import { createRideContext, createTestUser } from "../../../test/factories";
import type { Notification, NotificationType } from "@repo/shared";

const notificationsOfType = async (
    userId: string,
    type: NotificationType
): Promise<Notification[]> => {
    const all = await NotificationService.listForUser(userId, 50);
    return all.filter((n) => n.notificationType === type);
};

describe("booking notifications", () => {
    it("notifies the driver about a new booking request", async () => {
        const ctx = await createRideContext();
        const passenger = await createTestUser();

        const bookingId = await BookingService.createBookingRequest({
            rideId: ctx.rideId,
            passengerId: passenger.id,
            pickupStopId: ctx.pickupStopId,
            dropoffStopId: ctx.dropoffStopId,
            seatCount: 2,
        });

        const [notification] = await notificationsOfType(
            ctx.driver.id,
            "BOOKING_REQUEST"
        );
        expect(notification).toBeDefined();
        expect(notification.referenceEntityType).toBe("BOOKING");
        expect(notification.referenceEntityId).toBe(bookingId);
        expect(notification.payload).toMatchObject({
            rideId: ctx.rideId,
            bookingId,
            originCity: "Bratislava",
            destinationCity: "Trnava",
            seatCount: 2,
        });
    });

    it("notifies the passenger on confirm and auto-rejected passengers on capacity", async () => {
        const ctx = await createRideContext({
            rideOverrides: { offeredSeats: 1 },
        });
        const passengerA = await createTestUser();
        const passengerB = await createTestUser();

        const bookingA = await BookingService.createBookingRequest({
            rideId: ctx.rideId,
            passengerId: passengerA.id,
            pickupStopId: ctx.pickupStopId,
            dropoffStopId: ctx.dropoffStopId,
            seatCount: 1,
        });
        await BookingService.createBookingRequest({
            rideId: ctx.rideId,
            passengerId: passengerB.id,
            pickupStopId: ctx.pickupStopId,
            dropoffStopId: ctx.dropoffStopId,
            seatCount: 1,
        });

        await BookingService.confirmBooking(bookingA, ctx.driver.id);

        const [confirmed] = await notificationsOfType(
            passengerA.id,
            "BOOKING_CONFIRMED"
        );
        expect(confirmed).toBeDefined();
        expect(confirmed.referenceEntityId).toBe(bookingA);

        const [autoRejected] = await notificationsOfType(
            passengerB.id,
            "BOOKING_REJECTED"
        );
        expect(autoRejected).toBeDefined();
    });

    it("notifies the passenger when the driver rejects the booking", async () => {
        const ctx = await createRideContext();
        const passenger = await createTestUser();

        const bookingId = await BookingService.createBookingRequest({
            rideId: ctx.rideId,
            passengerId: passenger.id,
            pickupStopId: ctx.pickupStopId,
            dropoffStopId: ctx.dropoffStopId,
            seatCount: 1,
        });
        await BookingService.rejectBooking(bookingId, ctx.driver.id);

        const [notification] = await notificationsOfType(
            passenger.id,
            "BOOKING_REJECTED"
        );
        expect(notification).toBeDefined();
        expect(notification.referenceEntityId).toBe(bookingId);
    });

    it("notifies the driver when the passenger cancels their booking", async () => {
        const ctx = await createRideContext();
        const passenger = await createTestUser();

        const bookingId = await BookingService.createBookingRequest({
            rideId: ctx.rideId,
            passengerId: passenger.id,
            pickupStopId: ctx.pickupStopId,
            dropoffStopId: ctx.dropoffStopId,
            seatCount: 1,
        });
        await BookingService.cancelBookingByPassenger(bookingId, passenger.id);

        const [notification] = await notificationsOfType(
            ctx.driver.id,
            "BOOKING_CANCELLED"
        );
        expect(notification).toBeDefined();
        expect(notification.referenceEntityId).toBe(bookingId);
        expect(notification.payload?.cancelledBy).toBe("PASSENGER");
    });

    it("notifies the passenger when the driver cancels their booking", async () => {
        const ctx = await createRideContext();
        const passenger = await createTestUser();

        const bookingId = await BookingService.createBookingRequest({
            rideId: ctx.rideId,
            passengerId: passenger.id,
            pickupStopId: ctx.pickupStopId,
            dropoffStopId: ctx.dropoffStopId,
            seatCount: 1,
        });
        await BookingService.cancelBookingByDriver(bookingId, ctx.driver.id);

        const [notification] = await notificationsOfType(
            passenger.id,
            "BOOKING_CANCELLED"
        );
        expect(notification).toBeDefined();
        expect(notification.payload?.cancelledBy).toBe("DRIVER");
    });
});

describe("ride notifications", () => {
    it("notifies every active-booking passenger when the ride is cancelled", async () => {
        const ctx = await createRideContext();
        const passengerA = await createTestUser();
        const passengerB = await createTestUser();

        for (const passenger of [passengerA, passengerB]) {
            await BookingService.createBookingRequest({
                rideId: ctx.rideId,
                passengerId: passenger.id,
                pickupStopId: ctx.pickupStopId,
                dropoffStopId: ctx.dropoffStopId,
                seatCount: 1,
            });
        }

        await RideService.cancelRide(ctx.rideId, ctx.driver.id);

        for (const passenger of [passengerA, passengerB]) {
            const [notification] = await notificationsOfType(
                passenger.id,
                "RIDE_CANCELLED"
            );
            expect(notification).toBeDefined();
            expect(notification.referenceEntityType).toBe("RIDE");
            expect(notification.referenceEntityId).toBe(ctx.rideId);
        }
    });

    it("notifies confirmed passengers on ride completion; pending passengers get nothing", async () => {
        const ctx = await createRideContext({
            departureAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        });
        const confirmedPassenger = await createTestUser();
        const pendingPassenger = await createTestUser();

        const confirmedBooking = await BookingService.createBookingRequest({
            rideId: ctx.rideId,
            passengerId: confirmedPassenger.id,
            pickupStopId: ctx.pickupStopId,
            dropoffStopId: ctx.dropoffStopId,
            seatCount: 1,
        });
        await BookingService.createBookingRequest({
            rideId: ctx.rideId,
            passengerId: pendingPassenger.id,
            pickupStopId: ctx.pickupStopId,
            dropoffStopId: ctx.dropoffStopId,
            seatCount: 1,
        });
        await BookingService.confirmBooking(confirmedBooking, ctx.driver.id);

        await RideService.completeRide(ctx.rideId, ctx.driver.id);

        const [completed] = await notificationsOfType(
            confirmedPassenger.id,
            "RIDE_COMPLETED"
        );
        expect(completed).toBeDefined();
        expect(completed.referenceEntityId).toBe(ctx.rideId);

        await expect(
            notificationsOfType(pendingPassenger.id, "RIDE_COMPLETED")
        ).resolves.toHaveLength(0);

        // Completing again is a no-op — no duplicate notifications.
        await RideService.completeRide(ctx.rideId, ctx.driver.id);
        await expect(
            notificationsOfType(confirmedPassenger.id, "RIDE_COMPLETED")
        ).resolves.toHaveLength(1);
    });
});
