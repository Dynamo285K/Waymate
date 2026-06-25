import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { apiRequest, jsonRequest } from "../../../test/http";
import {
    authenticatedRequest,
    createSignedInUser,
} from "../../../test/auth-helpers";
import { db } from "../../db";
import { bookings as bookingsTable } from "../../db/schema";
import { BookingService } from "./booking.service";
import { BookingErrorCodes } from "./booking.errors";
import { createRideContext } from "../../../test/factories";

describe("BookingRoutes", () => {
    describe("Authorization & Onboarding Guards", () => {
        it("returns 401 UNAUTHORIZED for GET /bookings/me without a session", async () => {
            const response = await apiRequest(
                "/bookings/me?timeframe=UPCOMING"
            );
            expect(response.status).toBe(401);
            await expect(response.json()).resolves.toEqual({
                error: "UNAUTHORIZED",
            });
        });

        it("returns 403 ONBOARDING_REQUIRED for GET /bookings/me with a non-onboarded user", async () => {
            const { cookie } = await createSignedInUser({ onboarded: false });
            const response = await authenticatedRequest(
                "/bookings/me?timeframe=UPCOMING",
                cookie
            );
            expect(response.status).toBe(403);
            await expect(response.json()).resolves.toEqual({
                error: "ONBOARDING_REQUIRED",
            });
        });
    });

    describe("Passenger Routes", () => {
        it("creates a booking request via POST /bookings", async () => {
            const setup = await createRideContext();
            const { user: passenger, cookie: passengerCookie } =
                await createSignedInUser();

            const body = {
                rideId: setup.rideId,
                pickupStopId: setup.pickupStopId,
                dropoffStopId: setup.dropoffStopId,
                seatCount: 1,
                priceAmount: 1500,
            };

            const response = await authenticatedRequest(
                "/bookings",
                passengerCookie,
                jsonRequest(body)
            );

            expect(response.status).toBe(201);
            const payload = (await response.json()) as {
                id: string;
                status: string;
            };
            expect(payload.id).toBeTruthy();
            expect(payload.status).toBe("PENDING");

            const booking = await db.query.bookings.findFirst({
                where: eq(bookingsTable.id, payload.id),
            });
            expect(booking!.passengerId).toBe(passenger.id);
            expect(booking!.bookingStatus).toBe("PENDING");
        });

        it("returns 409 SelfBookingNotAllowed if driver tries to book their own ride via POST /bookings", async () => {
            const setup = await createRideContext();

            const body = {
                rideId: setup.rideId,
                pickupStopId: setup.pickupStopId,
                dropoffStopId: setup.dropoffStopId,
                seatCount: 1,
                priceAmount: 1500,
            };

            const response = await authenticatedRequest(
                "/bookings",
                setup.driverCookie,
                jsonRequest(body)
            );

            expect(response.status).toBe(400);
            await expect(response.json()).resolves.toMatchObject({
                error: BookingErrorCodes.SelfBookingNotAllowed,
            });
        });

        it("lists passenger bookings via GET /bookings/me", async () => {
            const setup = await createRideContext();
            const { user: passenger, cookie: passengerCookie } =
                await createSignedInUser();

            const bookingId = await BookingService.createBookingRequest({
                rideId: setup.rideId,
                passengerId: passenger.id,
                pickupStopId: setup.pickupStopId,
                dropoffStopId: setup.dropoffStopId,
                seatCount: 1,
            });

            const response = await authenticatedRequest(
                "/bookings/me?timeframe=UPCOMING",
                passengerCookie,
                { method: "GET" }
            );

            expect(response.status).toBe(200);
            const payload = (await response.json()) as { id: string }[];
            expect(payload).toHaveLength(1);
            expect(payload[0]!.id).toBe(bookingId);
        });

        it("cancels a passenger booking via PATCH /bookings/:id/cancel", async () => {
            const setup = await createRideContext();
            const { user: passenger, cookie: passengerCookie } =
                await createSignedInUser();

            const bookingId = await BookingService.createBookingRequest({
                rideId: setup.rideId,
                passengerId: passenger.id,
                pickupStopId: setup.pickupStopId,
                dropoffStopId: setup.dropoffStopId,
                seatCount: 1,
            });

            const response = await authenticatedRequest(
                `/bookings/${bookingId}/cancel`,
                passengerCookie,
                {
                    method: "PATCH",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({ reason: "Changed my mind" }),
                }
            );

            expect(response.status).toBe(200);
            const payload = (await response.json()) as {
                id: string;
                status: string;
            };
            expect(payload.status).toBe("CANCELLED");

            const booking = await db.query.bookings.findFirst({
                where: eq(bookingsTable.id, bookingId),
            });
            expect(booking!.bookingStatus).toBe("CANCELLED");
        });

        it("returns 403 when trying to cancel someone else's booking", async () => {
            const setup = await createRideContext();
            const { user: passenger1 } = await createSignedInUser();
            const { cookie: passenger2Cookie } = await createSignedInUser();

            const bookingId = await BookingService.createBookingRequest({
                rideId: setup.rideId,
                passengerId: passenger1.id,
                pickupStopId: setup.pickupStopId,
                dropoffStopId: setup.dropoffStopId,
                seatCount: 1,
            });

            const response = await authenticatedRequest(
                `/bookings/${bookingId}/cancel`,
                passenger2Cookie,
                {
                    method: "PATCH",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({ reason: "Sneaky cancel" }),
                }
            );

            expect(response.status).toBe(403);
            await expect(response.json()).resolves.toMatchObject({
                error: BookingErrorCodes.UnauthorizedAction,
            });
        });
    });

    describe("Driver Routes", () => {
        async function setupPendingBooking() {
            const setup = await createRideContext();
            const { user: passenger } = await createSignedInUser();

            const bookingId = await BookingService.createBookingRequest({
                rideId: setup.rideId,
                passengerId: passenger.id,
                pickupStopId: setup.pickupStopId,
                dropoffStopId: setup.dropoffStopId,
                seatCount: 1,
            });

            return { ...setup, passenger, bookingId };
        }

        it("returns driver pending requests via GET /bookings/requests", async () => {
            const { driverCookie, bookingId } = await setupPendingBooking();

            const response = await authenticatedRequest(
                "/bookings/requests",
                driverCookie,
                { method: "GET" }
            );

            expect(response.status).toBe(200);
            const payload = (await response.json()) as { id: string }[];

            expect(payload).toHaveLength(1);
            expect(payload[0]!.id).toBe(bookingId);
        });

        it("confirms a booking via PATCH /bookings/:id/confirm", async () => {
            const { driverCookie, bookingId } = await setupPendingBooking();

            const response = await authenticatedRequest(
                `/bookings/${bookingId}/confirm`,
                driverCookie,
                {
                    method: "PATCH",
                }
            );

            expect(response.status).toBe(200);
            const payload = (await response.json()) as {
                id: string;
                status: string;
            };
            expect(payload.status).toBe("CONFIRMED");

            const booking = await db.query.bookings.findFirst({
                where: eq(bookingsTable.id, bookingId),
            });
            expect(booking!.bookingStatus).toBe("CONFIRMED");
        });

        it("rejects a booking via PATCH /bookings/:id/reject", async () => {
            const { driverCookie, bookingId } = await setupPendingBooking();

            const response = await authenticatedRequest(
                `/bookings/${bookingId}/reject`,
                driverCookie,
                {
                    method: "PATCH",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({
                        reason: "Not enough space for luggage",
                    }),
                }
            );

            expect(response.status).toBe(200);

            const booking = await db.query.bookings.findFirst({
                where: eq(bookingsTable.id, bookingId),
            });
            expect(booking!.bookingStatus).toBe("REJECTED");
        });

        it("driver cancels a confirmed booking via PATCH /bookings/:id/driver/cancel", async () => {
            const { driver, driverCookie, bookingId } =
                await setupPendingBooking();

            await BookingService.confirmBooking(bookingId, driver.id);

            const response = await authenticatedRequest(
                `/bookings/${bookingId}/driver/cancel`,
                driverCookie,
                {
                    method: "PATCH",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({ reason: "Car broke down" }),
                }
            );

            expect(response.status).toBe(200);

            const booking = await db.query.bookings.findFirst({
                where: eq(bookingsTable.id, bookingId),
            });
            expect(booking!.bookingStatus).toBe("CANCELLED");
        });

        it("returns 403 when a non-driver tries to confirm a booking", async () => {
            const { bookingId } = await setupPendingBooking();
            const { cookie: strangerCookie } = await createSignedInUser();

            const response = await authenticatedRequest(
                `/bookings/${bookingId}/confirm`,
                strangerCookie,
                {
                    method: "PATCH",
                }
            );

            expect(response.status).toBe(403);
            await expect(response.json()).resolves.toMatchObject({
                error: BookingErrorCodes.UnauthorizedAction,
            });
        });
    });
});
