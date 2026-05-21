import { describe, it, expect } from "vitest";
import { asc, eq } from "drizzle-orm";
import { db } from "../../db";
import {
    carModels,
    cars,
    rides as ridesTable,
    rideStops,
    users,
} from "../../db/schema";
import { ReviewService, REVIEW_WINDOW_DAYS } from "./review.service";
import { ReviewError, ReviewErrorCodes } from "./review.errors";
import { RideService } from "../rides/ride.service";
import { BookingService } from "../bookings/booking.service";
import { TEST_CITY_IDS } from "../../../test/reference-data";
import type { CreateRideBody } from "@repo/shared";

async function insertTestUser() {
    const [user] = await db
        .insert(users)
        .values({
            name: "Test User",
            email: `test-${crypto.randomUUID()}@example.com`,
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
            spz: `V${crypto.randomUUID().slice(0, 6).toUpperCase()}`,
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
    departureAt: Date,
    overrides: Partial<CreateRideBody> = {}
): CreateRideBody {
    return {
        carId,
        departureAt,
        arrivalEstimateAt: new Date(departureAt.getTime() + 60 * 60 * 1000),
        offeredSeats: overrides.offeredSeats ?? 3,
        currency: "EUR",
        description: null,
        stops: [
            {
                address: "Hlavná 1",
                cityId: TEST_CITY_IDS.bratislava,
                lat: 48.148,
                lng: 17.107,
                plannedArrivalAt: null,
                plannedDepartureAt: departureAt,
            },
            {
                address: "Námestie SNP 1",
                cityId: TEST_CITY_IDS.banskaBystrica,
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

type CompletedRideSetup = {
    driver: Awaited<ReturnType<typeof insertTestUser>>;
    passenger: Awaited<ReturnType<typeof insertTestUser>>;
    rideId: string;
};

// Builds a ride in the past, with a CONFIRMED passenger, then flips the
// ride to COMPLETED via direct SQL — there's no service path for that
// transition yet. The departureAt is yesterday so the rating window is
// still open (REVIEW_WINDOW_DAYS=14).
async function setupCompletedRideWithPassenger(
    opts: {
        departureAt?: Date;
    } = {}
): Promise<CompletedRideSetup> {
    const driver = await insertTestUser();
    const passenger = await insertTestUser();
    const car = await insertCarFor(driver.id);

    // Default: 1 day ago — window stays open.
    const departureAt =
        opts.departureAt ?? new Date(Date.now() - 24 * 60 * 60 * 1000);

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

    // The service layer doesn't expose a "complete ride" transition (rides
    // only move PLANNED → CANCELLED), so we flip it directly here. Reviews
    // gate strictly on rideStatus === "COMPLETED".
    await db
        .update(ridesTable)
        .set({ rideStatus: "COMPLETED" })
        .where(eq(ridesTable.id, rideId));

    return { driver, passenger, rideId };
}

describe("ReviewService.submitReview validation", () => {
    it("throws SelfReviewNotAllowed when author and subject are the same user", async () => {
        const { driver, rideId } = await setupCompletedRideWithPassenger();

        await expect(
            ReviewService.submitReview({
                rideId,
                authorId: driver.id,
                subjectId: driver.id,
                rating: 5,
            })
        ).rejects.toMatchObject({
            code: ReviewErrorCodes.SelfReviewNotAllowed,
        });
    });

    it("throws RideNotFound for an unknown ride id", async () => {
        const author = await insertTestUser();
        const subject = await insertTestUser();

        await expect(
            ReviewService.submitReview({
                rideId: crypto.randomUUID(),
                authorId: author.id,
                subjectId: subject.id,
                rating: 4,
            })
        ).rejects.toMatchObject({ code: ReviewErrorCodes.RideNotFound });
    });

    it("throws RideNotCompleted when the ride is still PLANNED", async () => {
        const driver = await insertTestUser();
        const passenger = await insertTestUser();
        const car = await insertCarFor(driver.id);

        // Future departure — the ride stays PLANNED so we hit the not-completed branch.
        const departureAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const rideId = await RideService.createRide(
            driver.id,
            buildRideBody(car.id, departureAt)
        );

        await expect(
            ReviewService.submitReview({
                rideId,
                authorId: driver.id,
                subjectId: passenger.id,
                rating: 4,
            })
        ).rejects.toMatchObject({ code: ReviewErrorCodes.RideNotCompleted });
    });

    it("throws RatingWindowClosed when more than REVIEW_WINDOW_DAYS have passed since departure", async () => {
        const past = new Date(
            Date.now() - (REVIEW_WINDOW_DAYS + 1) * 24 * 60 * 60 * 1000
        );
        const { driver, passenger, rideId } =
            await setupCompletedRideWithPassenger({ departureAt: past });

        await expect(
            ReviewService.submitReview({
                rideId,
                authorId: driver.id,
                subjectId: passenger.id,
                rating: 4,
            })
        ).rejects.toMatchObject({
            code: ReviewErrorCodes.RatingWindowClosed,
        });
    });

    it("throws AuthorNotInRide when a stranger tries to review the driver", async () => {
        const { driver, rideId } = await setupCompletedRideWithPassenger();
        const stranger = await insertTestUser();

        await expect(
            ReviewService.submitReview({
                rideId,
                authorId: stranger.id,
                subjectId: driver.id,
                rating: 4,
            })
        ).rejects.toMatchObject({ code: ReviewErrorCodes.AuthorNotInRide });
    });

    it("throws SubjectNotInRide when the driver tries to review someone not in the ride", async () => {
        const { driver, rideId } = await setupCompletedRideWithPassenger();
        const stranger = await insertTestUser();

        await expect(
            ReviewService.submitReview({
                rideId,
                authorId: driver.id,
                subjectId: stranger.id,
                rating: 5,
            })
        ).rejects.toMatchObject({ code: ReviewErrorCodes.SubjectNotInRide });
    });

    it("throws InvalidPairing when one passenger tries to review another passenger", async () => {
        // Set up a ride with two confirmed passengers, then have one review the other.
        const driver = await insertTestUser();
        const passenger1 = await insertTestUser();
        const passenger2 = await insertTestUser();
        const car = await insertCarFor(driver.id);
        const departureAt = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const rideId = await RideService.createRide(
            driver.id,
            buildRideBody(car.id, departureAt, { offeredSeats: 3 })
        );

        const stops = await db
            .select({ id: rideStops.id, stopOrder: rideStops.stopOrder })
            .from(rideStops)
            .where(eq(rideStops.rideId, rideId))
            .orderBy(asc(rideStops.stopOrder));

        for (const p of [passenger1, passenger2]) {
            const bookingId = await BookingService.createBookingRequest({
                rideId,
                passengerId: p.id,
                pickupStopId: stops[0]!.id,
                dropoffStopId: stops[1]!.id,
                seatCount: 1,
            });
            await BookingService.confirmBooking(bookingId, driver.id);
        }

        await db
            .update(ridesTable)
            .set({ rideStatus: "COMPLETED" })
            .where(eq(ridesTable.id, rideId));

        await expect(
            ReviewService.submitReview({
                rideId,
                authorId: passenger1.id,
                subjectId: passenger2.id,
                rating: 5,
            })
        ).rejects.toMatchObject({ code: ReviewErrorCodes.InvalidPairing });
    });
});

describe("ReviewService.submitReview happy paths", () => {
    it("lets the driver review a confirmed passenger", async () => {
        const { driver, passenger, rideId } =
            await setupCompletedRideWithPassenger();

        const review = await ReviewService.submitReview({
            rideId,
            authorId: driver.id,
            subjectId: passenger.id,
            rating: 5,
            comment: "Great passenger",
        });

        expect(review.authorId).toBe(driver.id);
        expect(review.subjectId).toBe(passenger.id);
        expect(review.rating).toBe(5);
        expect(review.comment).toBe("Great passenger");
        expect(review.reviewStatus).toBe("VISIBLE");
    });

    it("lets a confirmed passenger review the driver", async () => {
        const { driver, passenger, rideId } =
            await setupCompletedRideWithPassenger();

        const review = await ReviewService.submitReview({
            rideId,
            authorId: passenger.id,
            subjectId: driver.id,
            rating: 4,
        });

        expect(review.authorId).toBe(passenger.id);
        expect(review.subjectId).toBe(driver.id);
        expect(review.rating).toBe(4);
        expect(review.comment).toBeNull();
    });

    it("throws AlreadyExists when the same (ride, author, subject) is reviewed twice", async () => {
        const { driver, passenger, rideId } =
            await setupCompletedRideWithPassenger();

        await ReviewService.submitReview({
            rideId,
            authorId: driver.id,
            subjectId: passenger.id,
            rating: 5,
        });

        await expect(
            ReviewService.submitReview({
                rideId,
                authorId: driver.id,
                subjectId: passenger.id,
                rating: 3,
            })
        ).rejects.toMatchObject({ code: ReviewErrorCodes.AlreadyExists });
    });
});

describe("ReviewService listings", () => {
    it("aggregates average rating and review entries after two reviews land", async () => {
        const driver = await insertTestUser();
        const passenger = await insertTestUser();
        const otherDriver = await insertTestUser();
        const car = await insertCarFor(driver.id);
        const car2 = await insertCarFor(otherDriver.id);
        const past = new Date(Date.now() - 24 * 60 * 60 * 1000);

        async function bookAndComplete(d: { id: string }, c: { id: string }) {
            const rideId = await RideService.createRide(
                d.id,
                buildRideBody(c.id, past)
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
            await BookingService.confirmBooking(bookingId, d.id);
            await db
                .update(ridesTable)
                .set({ rideStatus: "COMPLETED" })
                .where(eq(ridesTable.id, rideId));
            return rideId;
        }

        const rideA = await bookAndComplete(driver, car);
        const rideB = await bookAndComplete(otherDriver, car2);

        await ReviewService.submitReview({
            rideId: rideA,
            authorId: driver.id,
            subjectId: passenger.id,
            rating: 5,
            comment: "Pleasant ride",
        });
        await ReviewService.submitReview({
            rideId: rideB,
            authorId: otherDriver.id,
            subjectId: passenger.id,
            rating: 3,
        });

        const summary = await ReviewService.getReviewsForUser(passenger.id);
        expect(summary.reviewCount).toBe(2);
        expect(summary.averageRating).toBe(4);
        expect(summary.reviews.map((r) => r.rating).sort()).toEqual([3, 5]);
    });

    it("returns reviews authored by a given user, newest first", async () => {
        const { driver, passenger, rideId } =
            await setupCompletedRideWithPassenger();

        await ReviewService.submitReview({
            rideId,
            authorId: driver.id,
            subjectId: passenger.id,
            rating: 5,
            comment: "Nice",
        });

        const authored = await ReviewService.getMyAuthoredReviews(driver.id);
        expect(authored).toHaveLength(1);
        expect(authored[0]!.subject.id).toBe(passenger.id);
        expect(authored[0]!.rating).toBe(5);
    });
});

void ReviewError;
