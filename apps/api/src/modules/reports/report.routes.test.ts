import { describe, expect, it } from "vitest";
import { apiRequest, jsonRequest } from "../../../test/http";
import {
    authenticatedRequest,
    createSignedInUser,
} from "../../../test/auth-helpers";
import { ReportErrorCodes } from "./report.errors";
import { createRideContext } from "../../../test/factories";

async function setupSharedRide() {
    const ctx = await createRideContext({ withPassenger: true });
    return {
        driver: ctx.driver,
        driverCookie: ctx.driverCookie,
        passenger: ctx.passenger!,
        passengerCookie: ctx.passengerCookie!,
        rideId: ctx.rideId,
    };
}

describe("ReportRoutes", () => {
    describe("Authorization & Onboarding Guards", () => {
        it("returns 401 UNAUTHORIZED for POST /reports without a session", async () => {
            const response = await apiRequest(
                "/reports",
                jsonRequest({
                    targetUserId: crypto.randomUUID(),
                    reportType: "OTHER",
                    description: "Test report",
                })
            );
            expect(response.status).toBe(401);
            await expect(response.json()).resolves.toEqual({
                error: "UNAUTHORIZED",
            });
        });

        it("returns 403 ONBOARDING_REQUIRED for POST /reports with a non-onboarded user", async () => {
            const { cookie } = await createSignedInUser({ onboarded: false });
            const response = await authenticatedRequest(
                "/reports",
                cookie,
                jsonRequest({
                    targetUserId: crypto.randomUUID(),
                    reportType: "OTHER",
                    description: "Test report",
                })
            );
            expect(response.status).toBe(403);
            await expect(response.json()).resolves.toEqual({
                error: "ONBOARDING_REQUIRED",
            });
        });
    });

    describe("Report Validation (Negative Tests)", () => {
        it("returns 400 SelfReportNotAllowed when reporting yourself", async () => {
            const { user, cookie } = await createSignedInUser();
            const response = await authenticatedRequest(
                "/reports",
                cookie,
                jsonRequest({
                    targetUserId: user.id,
                    reportType: "OTHER",
                    description: "Reporting myself",
                })
            );
            expect(response.status).toBe(400);
            await expect(response.json()).resolves.toMatchObject({
                error: ReportErrorCodes.SelfReportNotAllowed,
            });
        });

        it("returns 404 TargetUserNotFound when reporting a non-existent user", async () => {
            const { cookie } = await createSignedInUser();
            const response = await authenticatedRequest(
                "/reports",
                cookie,
                jsonRequest({
                    targetUserId: crypto.randomUUID(), // Random non-existent UUID
                    reportType: "INAPPROPRIATE_BEHAVIOR",
                    description: "User does not exist",
                })
            );
            expect(response.status).toBe(404);
            await expect(response.json()).resolves.toMatchObject({
                error: ReportErrorCodes.TargetUserNotFound,
            });
        });

        it("returns 403 TargetNotAllowed when reporting someone you never shared a ride with", async () => {
            const reporter = await createSignedInUser();
            const target = await createSignedInUser();

            const response = await authenticatedRequest(
                "/reports",
                reporter.cookie,
                jsonRequest({
                    targetUserId: target.user.id,
                    reportType: "OTHER",
                    description: "Reporting a stranger",
                })
            );
            expect(response.status).toBe(403);
            await expect(response.json()).resolves.toMatchObject({
                error: ReportErrorCodes.TargetNotAllowed,
            });
        });

        it("returns 404 RideNotFound when supplying an invalid rideId context", async () => {
            const { passengerCookie, driver } = await setupSharedRide();

            const response = await authenticatedRequest(
                "/reports",
                passengerCookie,
                jsonRequest({
                    targetUserId: driver.id,
                    rideId: crypto.randomUUID(), // Valid target, invalid ride context
                    reportType: "SAFETY_ISSUE",
                    description: "Wrong ride ID context",
                })
            );
            expect(response.status).toBe(404);
            await expect(response.json()).resolves.toMatchObject({
                error: ReportErrorCodes.RideNotFound,
            });
        });
    });

    describe("Report Creation (Positive Tests)", () => {
        it("successfully creates a report via POST /reports (no rideId context)", async () => {
            const { driverCookie, passenger } = await setupSharedRide();

            const response = await authenticatedRequest(
                "/reports",
                driverCookie,
                jsonRequest({
                    targetUserId: passenger.id,
                    reportType: "NO_SHOW",
                    description: "Passenger didn't arrive",
                })
            );

            expect(response.status).toBe(201);
            const data = (await response.json()) as {
                id: string;
                reportStatus: string;
            };
            expect(data.id).toBeTruthy();
            expect(data.reportStatus).toBe("OPEN");
        });

        it("successfully creates a report via POST /reports (with rideId context)", async () => {
            const { passengerCookie, driver, rideId } = await setupSharedRide();

            const response = await authenticatedRequest(
                "/reports",
                passengerCookie,
                jsonRequest({
                    targetUserId: driver.id,
                    rideId,
                    reportType: "SAFETY_ISSUE",
                    description: "Driver was speeding",
                })
            );

            expect(response.status).toBe(201);
            const data = (await response.json()) as {
                id: string;
                reportStatus: string;
            };
            expect(data.id).toBeTruthy();
            expect(data.reportStatus).toBe("OPEN");
        });
    });
});
