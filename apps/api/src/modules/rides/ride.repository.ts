import {
    eq,
    and,
    isNull,
    isNotNull,
    asc,
    desc,
    gte,
    lt,
    inArray,
    ne,
    aliasedTable,
} from "drizzle-orm";
import { db } from "../../db";
import { rides as ridesTable } from "../../db/schema/ride";
import { rideStops as rideStopsTable } from "../../db/schema/ride_stop";
import { prices as pricesTable } from "../../db/schema/price";
import { bookings as bookingsTable } from "../../db/schema/booking";
import { users as usersTable } from "../../db/schema/user";
import { rideStatusHistory as rideStatusHistoryTable } from "../../db/schema/ride_status_history";
import { bookingStatusHistory as bookingStatusHistoryTable } from "../../db/schema";
import { cars as carsTable } from "../../db/schema/car";
import type {
    RideListItem,
    RideTimeframe,
    RidePassengersView,
    RideSearchResultItem,
    CreateRideInput,
} from "./ride.types";
import { RideErrors } from "./ride.errors";

/**
 * Retrieves a list of rides offered by a specific driver.
 * Filters rides by timeframe (upcoming or past) and excludes soft-deleted rides.
 * Includes related ride stops, bookings (confirmed/completed), and pricing information.
 *
 * @param driverId - The ID of the driver
 * @param timeframe - Either "UPCOMING" (future rides) or "PAST" (completed rides). Defaults to "UPCOMING"
 * @returns Array of RideListItem objects with stops and pricing details
 */
const findRidesByDriverId = async (
    driverId: string,
    timeframe: RideTimeframe = "UPCOMING"
): Promise<RideListItem[]> => {
    // Use current timestamp to split upcoming vs past rides.
    const now = new Date();

    // Base filters shared by all timeframe queries.
    const filters = [
        eq(ridesTable.driverId, driverId),
        isNull(ridesTable.deletedAt),
        ne(ridesTable.rideStatus, "CANCELLED"),
    ];

    // Add timeframe-specific condition.
    if (timeframe === "UPCOMING") {
        filters.push(gte(ridesTable.departureAt, now));
    } else if (timeframe === "PAST") {
        filters.push(lt(ridesTable.departureAt, now));
    }

    // Load rides with compact relation payloads for list views.
    const result = await db.query.rides.findMany({
        where: and(...filters),
        with: {
            rideStops: {
                columns: {
                    city: true,
                    stopOrder: true,
                },
                orderBy: [asc(rideStopsTable.stopOrder)],
            },
            bookings: {
                where: inArray(bookingsTable.bookingStatus, [
                    "CONFIRMED",
                    "COMPLETED",
                ]),
                columns: {
                    id: true,
                    seatCount: true,
                },
            },
            prices: {
                columns: {
                    amount: true,
                    currency: true,
                    startStopId: true,
                    endStopId: true,
                },
            },
        },
        orderBy: [
            timeframe === "UPCOMING"
                ? asc(ridesTable.departureAt)
                : desc(ridesTable.departureAt),
        ],
    });

    return result as RideListItem[];
};

/**
 * Fetches comprehensive ride information including all confirmed/completed bookings and passenger details.
 * Returns ride metadata, stops, and a list of passengers with their booking and stop information.
 * Excludes soft-deleted rides.
 *
 * @param rideId - The ID of the ride to fetch
 * @returns RidePassengersView object containing ride details and passenger information, or null if ride not found
 */
const findRidePassengersByRideId = async (
    rideId: string,
    driverId: string
): Promise<RidePassengersView | null> => {
    // Fetch ride header + bookings + related stop and passenger data.
    const result = await db.query.rides.findFirst({
        where: and(
            eq(ridesTable.id, rideId),
            eq(ridesTable.driverId, driverId),
            isNull(ridesTable.deletedAt)
        ),
        columns: {
            id: true,
            departureAt: true,
            rideStatus: true,
            offeredSeats: true,
            currency: true,
        },
        with: {
            rideStops: {
                columns: {
                    id: true,
                    city: true,
                    stopOrder: true,
                },
                orderBy: [asc(rideStopsTable.stopOrder)],
            },
            bookings: {
                where: inArray(bookingsTable.bookingStatus, [
                    "CONFIRMED",
                    "COMPLETED",
                ]),
                columns: {
                    id: true,
                    bookingStatus: true,
                    seatCount: true,
                },
                with: {
                    passenger: {
                        columns: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            profilePhotoUrl: true,
                        },
                    },
                    pickupStop: {
                        columns: {
                            id: true,
                            city: true,
                            stopOrder: true,
                        },
                    },
                    dropoffStop: {
                        columns: {
                            id: true,
                            city: true,
                            stopOrder: true,
                        },
                    },
                },
            },
        },
    });

    if (!result) return null;

    // Aggregate passenger seats from confirmed/completed bookings.
    const totalPassengers = result.bookings.reduce(
        (sum, b) => sum + b.seatCount,
        0
    );

    // Map DB response into API-facing passenger view model.
    const view: RidePassengersView = {
        ride: {
            id: result.id,
            departureAt: result.departureAt,
            rideStatus: result.rideStatus,
            offeredSeats: result.offeredSeats,
            currency: result.currency,
            rideStops: result.rideStops,
        },
        passengerCount: totalPassengers,
        passengers: result.bookings.map((b) => ({
            bookingId: b.id,
            bookingStatus: b.bookingStatus,
            seatCount: b.seatCount,
            passenger: b.passenger,
            pickupStop: b.pickupStop,
            dropoffStop: b.dropoffStop,
        })),
    };

    return view;
};

// 1. Create aliases for the stops table (it is joined twice)
const pickupStops = aliasedTable(rideStopsTable, "pickup_stops");
const dropoffStops = aliasedTable(rideStopsTable, "dropoff_stops");

/**
 * Searches for planned rides between two cities on a specific travel date.
 * Includes driver public profile, pickup/dropoff stop timing, and segment price (if available).
 * Excludes soft-deleted and non-planned rides and enforces correct stop order direction.
 *
 * @param startCity - Departure city name
 * @param destinationCity - Destination city name
 * @param travelDate - Requested travel date
 * @returns Array of RideSearchResultItem sorted by departure time (ascending)
 */
const searchRides = async (
    startCity: string,
    destinationCity: string,
    travelDate: Date // Date received from frontend
): Promise<RideSearchResultItem[]> => {
    // 2. Prepare the day boundaries for filtering
    // (If user searches for March 15, include rides from 00:00 to 23:59)
    const startOfDay = new Date(travelDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(travelDate);
    endOfDay.setHours(23, 59, 59, 999);

    // 3. Main database query
    const result = await db
        .select({
            rideId: ridesTable.id,
            departureAt: ridesTable.departureAt,
            rideStatus: ridesTable.rideStatus,
            offeredSeats: ridesTable.offeredSeats,
            currency: ridesTable.currency,

            driver: {
                id: usersTable.id,
                firstName: usersTable.firstName,
                lastName: usersTable.lastName,
                profilePhotoUrl: usersTable.profilePhotoUrl,
            },

            pickupStop: {
                pickupStopId: pickupStops.id,
                city: pickupStops.city,
                plannedDepartureAt: pickupStops.plannedDepartureAt,
            },

            dropoffStop: {
                dropoffStopId: dropoffStops.id,
                city: dropoffStops.city,
                plannedArrivalAt: dropoffStops.plannedArrivalAt,
            },

            priceAmount: pricesTable.amount,
        })
        .from(ridesTable)
        // Join driver profile
        .innerJoin(usersTable, eq(ridesTable.driverId, usersTable.id))

        // Join pickup stop filtered by requested start city
        .innerJoin(
            pickupStops,
            and(
                eq(ridesTable.id, pickupStops.rideId),
                eq(pickupStops.city, startCity)
            )
        )

        // Join dropoff stop filtered by requested destination city
        .innerJoin(
            dropoffStops,
            and(
                eq(ridesTable.id, dropoffStops.rideId),
                eq(dropoffStops.city, destinationCity)
            )
        )

        // Join exact segment price (LEFT JOIN allows missing price)
        .leftJoin(
            pricesTable,
            and(
                eq(pricesTable.rideId, ridesTable.id),
                eq(pricesTable.startStopId, pickupStops.id),
                eq(pricesTable.endStopId, dropoffStops.id)
            )
        )

        // Apply final business filters
        .where(
            and(
                // Ride must not be soft-deleted
                isNull(ridesTable.deletedAt),
                eq(ridesTable.rideStatus, "PLANNED"), // Only planned rides
                isNotNull(usersTable.firstName),
                isNotNull(usersTable.lastName),

                // Valid direction: pickup must be before dropoff
                lt(pickupStops.stopOrder, dropoffStops.stopOrder),

                // Travel date window
                gte(ridesTable.departureAt, startOfDay),
                lt(ridesTable.departureAt, endOfDay)
            )
        )
        // Sort by earliest departure
        .orderBy(asc(ridesTable.departureAt));

    return result as RideSearchResultItem[];
};

/**
 * Creates a new ride with all associated data in a single database transaction.
 * Inserts the ride record, ride stops, pricing information, and initial status history entry.
 * Maps frontend stop orders to database-generated UUIDs for pricing relationships.
 *
 * @param input - CreateRideInput object containing driver ID, car ID, stops, prices, and ride details
 * @returns The ID of the newly created ride
 */
const createRide = async (input: CreateRideInput) => {
    // Keep ride creation and all dependent inserts atomic.
    const createdRideId = await db.transaction(async (tx) => {
        const car = await tx.query.cars.findFirst({
            where: and(
                eq(carsTable.id, input.carId),
                eq(carsTable.ownerId, input.driverId),
                eq(carsTable.isActive, true),
                isNull(carsTable.deletedAt)
            ),
        });

        if (!car) {
            throw new Error(RideErrors.CarNotAvailableForDriver);
        }

        // Insert the ride first so we can reference its ID and default values.
        const [newRide] = await tx
            .insert(ridesTable)
            .values({
                driverId: input.driverId,
                carId: input.carId,
                departureAt: input.departureAt,
                arrivalEstimateAt: input.arrivalEstimateAt,
                rideStatus: input.rideStatus || "PLANNED",
                offeredSeats: input.offeredSeats,
                currency: input.currency,
                description: input.description,
            })
            .returning({
                id: ridesTable.id,
                currency: ridesTable.currency,
                rideStatus: ridesTable.rideStatus,
            });

        // Prepare ordered ride stops for bulk insert.
        const stopsToInsert = input.stops.map((stop, index) => ({
            rideId: newRide.id,
            stopOrder: index,
            address: stop.address,
            city: stop.city,
            countryCode: stop.countryCode,
            lat: stop.lat,
            lng: stop.lng,
            plannedArrivalAt: stop.plannedArrivalAt,
            plannedDepartureAt: stop.plannedDepartureAt,
        }));

        // Return generated stop IDs to map price segments by stop order.
        const insertedStops = await tx
            .insert(rideStopsTable)
            .values(stopsToInsert)
            .returning({
                id: rideStopsTable.id,
                stopOrder: rideStopsTable.stopOrder,
            });

        if (input.prices && input.prices.length > 0) {
            // Translate frontend stop-order references to actual DB stop IDs.
            const pricesToInsert = input.prices.map((priceParam) => {
                const startStop = insertedStops.find(
                    (s) => s.stopOrder === priceParam.startStopOrder
                );
                const endStop = insertedStops.find(
                    (s) => s.stopOrder === priceParam.endStopOrder
                );

                if (!startStop || !endStop) {
                    throw new Error(RideErrors.InvalidPriceStopOrders);
                }

                return {
                    rideId: newRide.id,
                    startStopId: startStop.id,
                    endStopId: endStop.id,
                    amount: priceParam.amount,
                    currency: priceParam.currency || newRide.currency,
                };
            });

            // Insert all segment prices in one operation.
            await tx.insert(pricesTable).values(pricesToInsert);
        }

        // Write initial status history entry for auditability.
        await tx.insert(rideStatusHistoryTable).values({
            rideId: newRide.id,
            newStatus: newRide.rideStatus,
            changedByUserId: input.changedByUserId || input.driverId,
            reason: input.reason || "Ride successfully created",
        });

        return newRide.id;
    });

    return createdRideId;
};

/**
 * Cancels an existing booking and writes the status change to booking status history.
 * Prevents repeated cancellation of already cancelled bookings.
 *
 * @param bookingId - The ID of the booking to cancel
 * @param cancelledByUserId - User ID performing the cancellation
 * @param reason - Optional cancellation reason
 * @returns ID of the cancelled booking
 
export const cancelBooking = async (
  bookingId: string,
  cancelledByUserId: string,
  reason?: string
): Promise<string> => {
  return await db.transaction(async (tx) => {
    const existingBooking = await tx.query.bookings.findFirst({
      where: eq(bookingsTable.id, bookingId),
      columns: { bookingStatus: true },
    });

    if (!existingBooking) throw new Error("Booking not found");
    if (existingBooking.bookingStatus === "CANCELLED") {
      throw new Error("Booking is already cancelled");
    }

    // 2. Update the booking record
    const [updatedBooking] = await tx.update(bookingsTable)
      .set({
        bookingStatus: "CANCELLED",
        cancelledAt: new Date(),
        cancelledByUserId: cancelledByUserId,
        cancellationReason: reason || null,
        updatedAt: new Date(),
      })
      .where(eq(bookingsTable.id, bookingId))
      .returning({ id: bookingsTable.id });

    // 3. Insert status change into booking status history
    await tx.insert(bookingStatusHistoryTable).values({
      bookingId: updatedBooking.id,
      oldStatus: existingBooking.bookingStatus,
      newStatus: "CANCELLED",
      changedByUserId: cancelledByUserId,
      reason: reason || "Cancelled by user",
    });

    return updatedBooking.id;
  });
};
*/

/**
 * Cancels an existing ride and cascades the cancellation to all active bookings.
 * Updates ride status, inserts ride status history, updates booking statuses,
 * and inserts booking status history records in a single transaction.
 *
 * @param rideId - The ID of the ride to cancel
 * @param driverId - User ID of the driver cancelling the ride
 * @param reason - Optional reason for cancellation
 * @returns ID of the cancelled ride
 */
const cancelRide = async (
    rideId: string,
    driverId: string,
    reason?: string
): Promise<string> => {
    return await db.transaction(async (tx) => {
        // 1. Fetch the current ride
        const existingRide = await tx.query.rides.findFirst({
            where: and(
                eq(ridesTable.id, rideId),
                eq(ridesTable.driverId, driverId)
            ),
            columns: { rideStatus: true },
        });
        if (!existingRide) throw new Error(RideErrors.RideNotFoundOrNotOwner);

        if (existingRide.rideStatus === "CANCELLED") {
            throw new Error(RideErrors.RideAlreadyCancelled);
        }

        // 2. Update the ride status to CANCELLED
        const [updatedRide] = await tx
            .update(ridesTable)
            .set({
                rideStatus: "CANCELLED",
                updatedAt: new Date(),
            })
            .where(
                and(
                    eq(ridesTable.id, rideId),
                    eq(ridesTable.driverId, driverId)
                )
            )
            .returning({ id: ridesTable.id });

        // 3. Write the ride status change to history (audit log)
        await tx.insert(rideStatusHistoryTable).values({
            rideId: updatedRide.id,
            oldStatus: existingRide.rideStatus,
            newStatus: "CANCELLED",
            changedByUserId: driverId,
            reason: reason || "Ride cancelled by driver",
        });

        // ==========================================
        // 4. CASCADE CANCELLATION OF BOOKINGS
        // ==========================================

        // Find all active bookings for this ride (pending or confirmed)
        const activeBookings = await tx.query.bookings.findMany({
            where: and(
                eq(bookingsTable.rideId, rideId),
                inArray(bookingsTable.bookingStatus, ["PENDING", "CONFIRMED"])
            ),
            columns: { id: true, bookingStatus: true },
        });

        // If there are active passengers, cancel their bookings in bulk
        if (activeBookings.length > 0) {
            const activeBookingIds = activeBookings.map((b) => b.id);
            const cancelReason = "Ride was cancelled by the driver";

            // A) Bulk update booking statuses
            await tx
                .update(bookingsTable)
                .set({
                    bookingStatus: "CANCELLED",
                    cancelledAt: new Date(),
                    cancelledByUserId: driverId,
                    cancellationReason: cancelReason,
                    updatedAt: new Date(),
                })
                .where(inArray(bookingsTable.id, activeBookingIds));

            // B) Bulk insert booking status history entries
            const bookingHistoryInserts = activeBookings.map((b) => ({
                bookingId: b.id,
                oldStatus: b.bookingStatus,
                newStatus: "CANCELLED" as const,
                changedByUserId: driverId,
                reason: cancelReason,
            }));

            await tx
                .insert(bookingStatusHistoryTable)
                .values(bookingHistoryInserts);
        }

        return updatedRide.id;
    });
};

export const RideRepository = {
    findRidesByDriverId,
    findRidePassengersByRideId,
    searchRides,
    createRide,
    cancelRide,
};
