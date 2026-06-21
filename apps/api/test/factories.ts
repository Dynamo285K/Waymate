import { asc, eq } from "drizzle-orm";
import { db } from "../src/db";
import { cars, rides as ridesTable, rideStops } from "../src/db/schema";
import { getAnyCarModelId } from "./reference-data";
import { createSignedInUser } from "./auth-helpers";
import { RideService } from "../src/modules/rides/ride.service";
import { BookingService } from "../src/modules/bookings/booking.service";
import { users } from "../src/db/schema";
import type { CreateRideBody } from "@repo/shared";

/**
 * Inserts a raw user directly into the database for tests that
 * don't need a full Better Auth session.
 */
export async function createTestUser(
    overrides?: Partial<typeof users.$inferInsert>
) {
    const [user] = await db
        .insert(users)
        .values({
            name: "Test User",
            email: `test-${crypto.randomUUID()}@example.com`,
            ...overrides,
        })
        .returning();
    if (!user) throw new Error("Failed to insert test user");
    return user;
}

/**
 * Inserts a car for the given owner.
 * You can override the default car attributes if needed.
 */
export async function createTestCar(
    ownerId: string,
    overrides?: Partial<typeof cars.$inferInsert>
) {
    const modelId = await getAnyCarModelId();
    const [car] = await db
        .insert(cars)
        .values({
            ownerId,
            modelId,
            spz: `TEST${crypto.randomUUID().slice(0, 3).toUpperCase()}`,
            countryCode: "SK",
            color: "BLACK",
            seatsTotal: 4,
            isActive: true,
            ...overrides,
        })
        .returning();
    if (!car) throw new Error("Failed to create test car");
    return car;
}

/**
 * Builds a standard CreateRideBody payload for the RideService.
 */
export function buildRideBody(
    carId: string,
    departureAt: Date,
    overrides?: Partial<CreateRideBody>
): CreateRideBody {
    return {
        carId,
        departureAt,
        arrivalEstimateAt: new Date(departureAt.getTime() + 60 * 60 * 1000),
        offeredSeats: overrides?.offeredSeats ?? 3,
        currency: "EUR",
        description: null,
        stops: [
            {
                address: "Start Point",
                city: "Bratislava",
                countryCode: "SK",
                lat: 48.1,
                lng: 17.1,
                plannedArrivalAt: null,
                plannedDepartureAt: departureAt,
            },
            {
                address: "End Point",
                city: "Trnava",
                countryCode: "SK",
                lat: 48.5,
                lng: 17.5,
                plannedArrivalAt: new Date(
                    departureAt.getTime() + 60 * 60 * 1000
                ),
                plannedDepartureAt: null,
            },
        ],
        prices: [{ startStopOrder: 0, endStopOrder: 1, amount: 1500 }],
        ...overrides,
    };
}

export type RideContextOptions = {
    /**
     * Specific departure time. Defaults to tomorrow (future)
     * if rideStatus is not COMPLETED, otherwise defaults to yesterday.
     */
    departureAt?: Date;
    /** If true, a passenger is created and their booking is confirmed. */
    withPassenger?: boolean;
    /** Allows forcefully updating the ride status via SQL (e.g., "COMPLETED"). */
    rideStatus?: "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
    /** Overrides for the ride payload */
    rideOverrides?: Partial<CreateRideBody>;
};

/**
 * Powerful composite factory that sets up a full ride context.
 * It creates the driver, their car, the ride, and optionally
 * a confirmed passenger and forcefully manipulates the ride status.
 */
export async function createRideContext(opts: RideContextOptions = {}) {
    const driverAuth = await createSignedInUser();
    const car = await createTestCar(driverAuth.user.id);

    // If they want a COMPLETED ride but didn't specify a date, default to yesterday
    // so the ride is realistically in the past. Otherwise, default to tomorrow.
    const defaultDeparture =
        opts.rideStatus === "COMPLETED"
            ? new Date(Date.now() - 24 * 60 * 60 * 1000)
            : new Date(Date.now() + 24 * 60 * 60 * 1000);

    const departureAt = opts.departureAt ?? defaultDeparture;

    const rideId = await RideService.createRide(
        driverAuth.user.id,
        buildRideBody(car.id, departureAt, opts.rideOverrides)
    );

    const stops = await db
        .select()
        .from(rideStops)
        .where(eq(rideStops.rideId, rideId))
        .orderBy(asc(rideStops.stopOrder));

    const pickupStopId = stops[0]!.id;
    const dropoffStopId = stops[1]!.id;

    let passengerAuth:
        | Awaited<ReturnType<typeof createSignedInUser>>
        | undefined;
    let bookingId: string | undefined;

    if (opts.withPassenger) {
        passengerAuth = await createSignedInUser();
        bookingId = await BookingService.createBookingRequest({
            rideId,
            passengerId: passengerAuth.user.id,
            pickupStopId,
            dropoffStopId,
            seatCount: 1,
        });
        await BookingService.confirmBooking(bookingId, driverAuth.user.id);
    }

    if (opts.rideStatus && opts.rideStatus !== "PLANNED") {
        await db
            .update(ridesTable)
            .set({ rideStatus: opts.rideStatus })
            .where(eq(ridesTable.id, rideId));
    }

    return {
        driver: driverAuth.user,
        driverCookie: driverAuth.cookie,
        car,
        rideId,
        pickupStopId,
        dropoffStopId,
        passenger: passengerAuth?.user,
        passengerCookie: passengerAuth?.cookie,
        bookingId,
    };
}
