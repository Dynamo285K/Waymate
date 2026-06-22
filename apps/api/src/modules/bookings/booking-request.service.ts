import { db } from "../../db";
import { BookingRepository } from "./booking.repository";
import { BookingError, BookingErrorCodes } from "./booking.errors";
import { BlockService } from "../blocks/block.service";
import type { CreateBookingInput } from "./booking.types";

export const createBookingRequest = async (
    payload: CreateBookingInput
): Promise<string> => {
    return await db.transaction(async (tx) => {
        const ride = await BookingRepository.lockRideForBooking(
            tx,
            payload.rideId
        );

        if (!ride || ride.rideStatus !== "PLANNED") {
            throw new BookingError(BookingErrorCodes.RideNotFoundOrUnavailable);
        }

        if (ride.driverId === payload.passengerId) {
            throw new BookingError(BookingErrorCodes.SelfBookingNotAllowed);
        }

        if (
            await BlockService.isBlockedBetween(
                ride.driverId,
                payload.passengerId,
                tx
            )
        ) {
            throw new BookingError(BookingErrorCodes.Blocked);
        }

        let finalPickupStopId = payload.pickupStopId;
        let finalDropoffStopId = payload.dropoffStopId;
        let finalAmount = 0;
        let currency = "EUR";

        if (payload.pickupStopId === "dynamic" && payload.dynamicPickup) {
            finalPickupStopId = await BookingRepository.insertDynamicStop(
                tx,
                payload.rideId,
                payload.dynamicPickup.lat,
                payload.dynamicPickup.lng,
                payload.dynamicPickup.city
            );
        }

        if (payload.dropoffStopId === "dynamic" && payload.dynamicDropoff) {
            finalDropoffStopId = await BookingRepository.insertDynamicStop(
                tx,
                payload.rideId,
                payload.dynamicDropoff.lat,
                payload.dynamicDropoff.lng,
                payload.dynamicDropoff.city
            );
        }

        const stops = await BookingRepository.findRideStops(
            tx,
            payload.rideId,
            [finalPickupStopId, finalDropoffStopId]
        );

        if (stops.length !== 2) {
            throw new BookingError(BookingErrorCodes.InvalidStops);
        }

        const pickup = stops.find((s) => s.id === finalPickupStopId);
        const dropoff = stops.find((s) => s.id === finalDropoffStopId);

        if (!pickup || !dropoff || pickup.stopOrder >= dropoff.stopOrder) {
            throw new BookingError(BookingErrorCodes.InvalidStops);
        }

        if (
            payload.pickupStopId === "dynamic" ||
            payload.dropoffStopId === "dynamic"
        ) {
            finalAmount = (payload.priceAmount || 0) * payload.seatCount;
            // Fallback currency
            const firstPrice = await tx.query.prices.findFirst({
                where: (prices, { eq }) => eq(prices.rideId, payload.rideId),
            });
            currency = firstPrice?.currency || "EUR";
        } else {
            const priceRecord = await BookingRepository.findSegmentPrice(
                tx,
                payload.rideId,
                finalPickupStopId,
                finalDropoffStopId
            );

            if (!priceRecord) {
                throw new BookingError(BookingErrorCodes.PriceNotFound);
            }
            finalAmount = priceRecord.amount * payload.seatCount;
            currency = priceRecord.currency;
        }

        const heldSeats = await BookingRepository.sumSeatsForRide(
            tx,
            payload.rideId,
            ["CONFIRMED", "COMPLETED"]
        );

        if (heldSeats + payload.seatCount > ride.offeredSeats) {
            throw new BookingError(BookingErrorCodes.NotEnoughSeats);
        }

        const existingBooking =
            await BookingRepository.findActiveBookingByPassenger(
                tx,
                payload.rideId,
                payload.passengerId
            );

        if (existingBooking) {
            throw new BookingError(BookingErrorCodes.AlreadyBooked);
        }

        const newBooking = await BookingRepository.insertBooking(tx, {
            passengerId: payload.passengerId,
            rideId: payload.rideId,
            pickupStopId: finalPickupStopId,
            dropoffStopId: finalDropoffStopId,
            requestedPickupCity: payload.requestedPickupCity ?? null,
            requestedDropoffCity: payload.requestedDropoffCity ?? null,
            seatCount: payload.seatCount,
            priceAmount: finalAmount,
            currency: currency,
        });

        await BookingRepository.insertBookingStatusHistory(tx, {
            bookingId: newBooking.id,
            newStatus: "PENDING",
            changedByUserId: payload.passengerId,
            reason: "Passenger requested booking",
        });

        return newBooking.id;
    });
};
