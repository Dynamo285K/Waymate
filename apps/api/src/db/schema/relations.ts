import { relations } from "drizzle-orm";
import { users } from "./user";
import { carModels } from "./car_model";
import { cars } from "./car";
import { rides } from "./ride";
import { rideStops } from "./ride_stop";
import { prices } from "./price";
import { bookings } from "./booking";
import { reviews } from "./review";
import { conversations } from "./conversation";
import { messages } from "./message";
import { notifications } from "./notification";
import { userStatusHistory } from "./user_status_history";
import { rideStatusHistory } from "./ride_status_history";
import { bookingStatusHistory } from "./booking_status_history";
import { blocklist } from "./blocklist";

export const usersRelations = relations(users, ({ many }) => ({
    cars: many(cars),
    drivenRides: many(rides),
    bookingsAsPassenger: many(bookings),
    bookingsCancelledByUser: many(bookings, {
        relationName: "booking_cancelled_by_user",
    }),
    authoredReviews: many(reviews, { relationName: "review_author" }),
    receivedReviews: many(reviews, { relationName: "review_subject" }),
    messages: many(messages),
    notifications: many(notifications),
    userStatusHistory: many(userStatusHistory, {
        relationName: "user_status_history_subject",
    }),
    userStatusChangesByUser: many(userStatusHistory, {
        relationName: "user_status_history_changed_by",
    }),
    rideStatusChangesByUser: many(rideStatusHistory),
    bookingStatusChangesByUser: many(bookingStatusHistory),
    blocklistAsBlocker: many(blocklist, { relationName: "blocklist_blocker" }),
    blocklistAsBlocked: many(blocklist, { relationName: "blocklist_blocked" }),
    blocklistAsRevoker: many(blocklist, {
        relationName: "blocklist_revoked_by",
    }),
}));

export const carModelsRelations = relations(carModels, ({ many }) => ({
    cars: many(cars),
}));

export const carsRelations = relations(cars, ({ one, many }) => ({
    owner: one(users, {
        fields: [cars.ownerId],
        references: [users.id],
    }),
    model: one(carModels, {
        fields: [cars.modelId],
        references: [carModels.id],
    }),
    rides: many(rides),
}));

export const ridesRelations = relations(rides, ({ one, many }) => ({
    driver: one(users, {
        fields: [rides.driverId],
        references: [users.id],
    }),
    car: one(cars, {
        fields: [rides.carId],
        references: [cars.id],
    }),
    rideStops: many(rideStops),
    prices: many(prices),
    bookings: many(bookings),
    reviews: many(reviews),
    conversations: many(conversations),
    statusHistory: many(rideStatusHistory),
}));

export const rideStopsRelations = relations(rideStops, ({ one, many }) => ({
    ride: one(rides, {
        fields: [rideStops.rideId],
        references: [rides.id],
    }),
    pricesAsStartStop: many(prices, { relationName: "price_start_stop" }),
    pricesAsEndStop: many(prices, { relationName: "price_end_stop" }),
    bookingsAsPickupStop: many(bookings, {
        relationName: "booking_pickup_stop",
    }),
    bookingsAsDropoffStop: many(bookings, {
        relationName: "booking_dropoff_stop",
    }),
}));

export const pricesRelations = relations(prices, ({ one }) => ({
    ride: one(rides, {
        fields: [prices.rideId],
        references: [rides.id],
    }),
    startStop: one(rideStops, {
        fields: [prices.startStopId],
        references: [rideStops.id],
        relationName: "price_start_stop",
    }),
    endStop: one(rideStops, {
        fields: [prices.endStopId],
        references: [rideStops.id],
        relationName: "price_end_stop",
    }),
}));

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
    passenger: one(users, {
        fields: [bookings.passengerId],
        references: [users.id],
    }),
    ride: one(rides, {
        fields: [bookings.rideId],
        references: [rides.id],
    }),
    pickupStop: one(rideStops, {
        fields: [bookings.pickupStopId],
        references: [rideStops.id],
        relationName: "booking_pickup_stop",
    }),
    dropoffStop: one(rideStops, {
        fields: [bookings.dropoffStopId],
        references: [rideStops.id],
        relationName: "booking_dropoff_stop",
    }),
    cancelledByUser: one(users, {
        fields: [bookings.cancelledByUserId],
        references: [users.id],
        relationName: "booking_cancelled_by_user",
    }),
    conversations: many(conversations),
    statusHistory: many(bookingStatusHistory),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
    ride: one(rides, {
        fields: [reviews.rideId],
        references: [rides.id],
    }),
    author: one(users, {
        fields: [reviews.authorId],
        references: [users.id],
        relationName: "review_author",
    }),
    subject: one(users, {
        fields: [reviews.subjectId],
        references: [users.id],
        relationName: "review_subject",
    }),
}));

export const conversationsRelations = relations(
    conversations,
    ({ one, many }) => ({
        ride: one(rides, {
            fields: [conversations.rideId],
            references: [rides.id],
        }),
        booking: one(bookings, {
            fields: [conversations.bookingId],
            references: [bookings.id],
        }),
        messages: many(messages),
    })
);

export const messagesRelations = relations(messages, ({ one }) => ({
    conversation: one(conversations, {
        fields: [messages.conversationId],
        references: [conversations.id],
    }),
    sender: one(users, {
        fields: [messages.senderId],
        references: [users.id],
    }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
    user: one(users, {
        fields: [notifications.userId],
        references: [users.id],
    }),
}));

export const userStatusHistoryRelations = relations(
    userStatusHistory,
    ({ one }) => ({
        user: one(users, {
            fields: [userStatusHistory.userId],
            references: [users.id],
            relationName: "user_status_history_subject",
        }),
        changedByUser: one(users, {
            fields: [userStatusHistory.changedByUserId],
            references: [users.id],
            relationName: "user_status_history_changed_by",
        }),
    })
);

export const rideStatusHistoryRelations = relations(
    rideStatusHistory,
    ({ one }) => ({
        ride: one(rides, {
            fields: [rideStatusHistory.rideId],
            references: [rides.id],
        }),
        changedByUser: one(users, {
            fields: [rideStatusHistory.changedByUserId],
            references: [users.id],
        }),
    })
);

export const bookingStatusHistoryRelations = relations(
    bookingStatusHistory,
    ({ one }) => ({
        booking: one(bookings, {
            fields: [bookingStatusHistory.bookingId],
            references: [bookings.id],
        }),
        changedByUser: one(users, {
            fields: [bookingStatusHistory.changedByUserId],
            references: [users.id],
        }),
    })
);

export const blocklistRelations = relations(blocklist, ({ one }) => ({
    blockerUser: one(users, {
        fields: [blocklist.blockerUserId],
        references: [users.id],
        relationName: "blocklist_blocker",
    }),
    blockedUser: one(users, {
        fields: [blocklist.blockedUserId],
        references: [users.id],
        relationName: "blocklist_blocked",
    }),
    revokedByUser: one(users, {
        fields: [blocklist.revokedByUserId],
        references: [users.id],
        relationName: "blocklist_revoked_by",
    }),
}));
