import { describe, expect, it } from "vitest";
import { asc, eq } from "drizzle-orm";
import { apiRequest, jsonRequest } from "../../../test/http";
import {
    authenticatedRequest,
    createSignedInUser,
} from "../../../test/auth-helpers";
import { REVIEW_WINDOW_DAYS } from "./review.service";
import { ReviewErrorCodes } from "./review.errors";
import { createRideContext } from "../../../test/factories";
// Builds a ride in the past, confirms a passenger, and completes the ride via SQL
async function setupCompletedRideWithPassenger(
    opts: { departureAt?: Date } = {}
) {
    const ctx = await createRideContext({
        withPassenger: true,
        rideStatus: "COMPLETED",
        departureAt: opts.departureAt,
    });
    return {
        driver: ctx.driver,
        driverCookie: ctx.driverCookie!,
        passenger: ctx.passenger!,
        passengerCookie: ctx.passengerCookie!,
        rideId: ctx.rideId,
    };
}

describe("ReviewRoutes", () => {
    describe("Authorization & Onboarding Guards", () => {
        it("returns 401 UNAUTHORIZED for POST /reviews without a session", async () => {
            const response = await apiRequest(
                "/reviews",
                jsonRequest({
                    rideId: crypto.randomUUID(),
                    subjectId: crypto.randomUUID(),
                    rating: 5,
                })
            );
            expect(response.status).toBe(401);
            await expect(response.json()).resolves.toEqual({
                error: "UNAUTHORIZED",
            });
        });

        it("returns 403 ONBOARDING_REQUIRED for POST /reviews with a non-onboarded user", async () => {
            const { cookie } = await createSignedInUser({ onboarded: false });
            const response = await authenticatedRequest(
                "/reviews",
                cookie,
                jsonRequest({
                    rideId: crypto.randomUUID(),
                    subjectId: crypto.randomUUID(),
                    rating: 5,
                })
            );
            expect(response.status).toBe(403);
            await expect(response.json()).resolves.toEqual({
                error: "ONBOARDING_REQUIRED",
            });
        });

        it("returns 401 UNAUTHORIZED for GET /reviews/users/:id without a session", async () => {
            const response = await apiRequest(
                `/reviews/users/${crypto.randomUUID()}`
            );
            expect(response.status).toBe(401);
        });

        it("returns 401 UNAUTHORIZED for GET /reviews/me/authored without a session", async () => {
            const response = await apiRequest("/reviews/me/authored");
            expect(response.status).toBe(401);
        });
    });

    describe("Review Creation Validation (Negative Tests)", () => {
        it("returns 400 SelfReviewNotAllowed when reviewing yourself", async () => {
            const { driver, driverCookie, rideId } =
                await setupCompletedRideWithPassenger();

            const response = await authenticatedRequest(
                "/reviews",
                driverCookie,
                jsonRequest({
                    rideId,
                    subjectId: driver.id, // self review
                    rating: 5,
                })
            );

            expect(response.status).toBe(400);
            await expect(response.json()).resolves.toMatchObject({
                error: ReviewErrorCodes.SelfReviewNotAllowed,
            });
        });

        it("returns 404 RideNotFound for a random rideId", async () => {
            const { driverCookie, passenger } =
                await setupCompletedRideWithPassenger();

            const response = await authenticatedRequest(
                "/reviews",
                driverCookie,
                jsonRequest({
                    rideId: crypto.randomUUID(),
                    subjectId: passenger.id,
                    rating: 5,
                })
            );

            expect(response.status).toBe(404);
            await expect(response.json()).resolves.toMatchObject({
                error: ReviewErrorCodes.RideNotFound,
            });
        });

        it("returns 403 AuthorNotInRide when a random user tries to write a review", async () => {
            const { driver, rideId } = await setupCompletedRideWithPassenger();
            const stranger = await createSignedInUser(); // Not in the ride

            const response = await authenticatedRequest(
                "/reviews",
                stranger.cookie,
                jsonRequest({
                    rideId,
                    subjectId: driver.id,
                    rating: 4,
                })
            );

            expect(response.status).toBe(403);
            await expect(response.json()).resolves.toMatchObject({
                error: ReviewErrorCodes.AuthorNotInRide,
            });
        });

        it("returns 400 SubjectNotInRide when reviewing a random user not in the ride", async () => {
            const { driverCookie, rideId } =
                await setupCompletedRideWithPassenger();
            const stranger = await createSignedInUser(); // Not in the ride

            const response = await authenticatedRequest(
                "/reviews",
                driverCookie,
                jsonRequest({
                    rideId,
                    subjectId: stranger.user.id,
                    rating: 4,
                })
            );

            expect(response.status).toBe(400);
            await expect(response.json()).resolves.toMatchObject({
                error: ReviewErrorCodes.SubjectNotInRide,
            });
        });

        it("returns 400 RideNotCompleted when ride is still PLANNED", async () => {
            const { passengerCookie, driver, rideId } = await createRideContext(
                {
                    withPassenger: true,
                    rideStatus: "PLANNED",
                }
            );

            const response = await authenticatedRequest(
                "/reviews",
                passengerCookie!,
                jsonRequest({
                    rideId,
                    subjectId: driver.id,
                    rating: 5,
                })
            );

            expect(response.status).toBe(400);
            await expect(response.json()).resolves.toMatchObject({
                error: ReviewErrorCodes.RideNotCompleted,
            });
        });

        it("returns 409 AlreadyExists if reviewing the same person twice for the same ride", async () => {
            const { driverCookie, passenger, rideId } =
                await setupCompletedRideWithPassenger();

            // First review
            await authenticatedRequest(
                "/reviews",
                driverCookie,
                jsonRequest({
                    rideId,
                    subjectId: passenger.id,
                    rating: 5,
                })
            );

            // Second review
            const response = await authenticatedRequest(
                "/reviews",
                driverCookie,
                jsonRequest({
                    rideId,
                    subjectId: passenger.id,
                    rating: 3,
                })
            );

            expect(response.status).toBe(409);
            await expect(response.json()).resolves.toMatchObject({
                error: ReviewErrorCodes.AlreadyExists,
            });
        });
    });

    describe("Happy Paths", () => {
        it("successfully creates a review via POST /reviews and fetches via GET /reviews/users/:id", async () => {
            const { driverCookie, passengerCookie, driver, passenger, rideId } =
                await setupCompletedRideWithPassenger();

            // Driver reviews passenger
            const createRes = await authenticatedRequest(
                "/reviews",
                driverCookie,
                jsonRequest({
                    rideId,
                    subjectId: passenger.id,
                    rating: 5,
                    comment: "Awesome!",
                })
            );

            expect(createRes.status).toBe(201);
            const createData = (await createRes.json()) as { id: string };
            expect(createData.id).toBeTruthy();

            // Passenger reviews driver
            await authenticatedRequest(
                "/reviews",
                passengerCookie,
                jsonRequest({
                    rideId,
                    subjectId: driver.id,
                    rating: 4,
                    comment: "Good driving",
                })
            );

            // Fetch driver's public reviews
            const fetchRes = await authenticatedRequest(
                `/reviews/users/${driver.id}`,
                passengerCookie,
                { method: "GET" }
            );
            expect(fetchRes.status).toBe(200);

            const fetchPayload = (await fetchRes.json()) as {
                averageRating: number;
                reviewCount: number;
                reviews: {
                    comment: string;
                    author: { id: string };
                }[];
            };
            expect(fetchPayload.reviewCount).toBe(1);
            expect(fetchPayload.averageRating).toBe(4);
            expect(fetchPayload.reviews[0]!.comment).toBe("Good driving");
            expect(fetchPayload.reviews[0]!.author.id).toBe(passenger.id);
        });

        it("successfully fetches my authored reviews via GET /reviews/me/authored", async () => {
            const { passengerCookie, driver, rideId } =
                await setupCompletedRideWithPassenger();

            // Passenger reviews driver
            await authenticatedRequest(
                "/reviews",
                passengerCookie,
                jsonRequest({
                    rideId,
                    subjectId: driver.id,
                    rating: 5,
                    comment: "Five stars",
                })
            );

            const authoredRes = await authenticatedRequest(
                "/reviews/me/authored",
                passengerCookie,
                { method: "GET" }
            );
            expect(authoredRes.status).toBe(200);

            const authoredPayload = (await authoredRes.json()) as {
                subject: { id: string };
                rating: number;
                comment: string;
            }[];
            expect(authoredPayload).toHaveLength(1);
            expect(authoredPayload[0]!.subject.id).toBe(driver.id);
            expect(authoredPayload[0]!.rating).toBe(5);
            expect(authoredPayload[0]!.comment).toBe("Five stars");
        });
    });
});
