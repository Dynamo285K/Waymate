import { pgEnum } from "drizzle-orm/pg-core";
import {
    blockReasonValues,
    blockStatusValues,
    bookingStatusValues,
    conversationTypeValues,
    deliveryStatusValues,
    messageTypeValues,
    notificationTypeValues,
    reviewStatusValues,
    rideStatusValues,
    userStatusValues,
    carColors,
} from "../../shared/status-values";

export const userStatusEnum = pgEnum("user_status", userStatusValues);

export const rideStatusEnum = pgEnum("ride_status", rideStatusValues);

export const bookingStatusEnum = pgEnum("booking_status", bookingStatusValues);

export const reviewStatusEnum = pgEnum("review_status", reviewStatusValues);

export const conversationTypeEnum = pgEnum(
    "conversation_type",
    conversationTypeValues
);

export const messageTypeEnum = pgEnum("message_type", messageTypeValues);

export const notificationTypeEnum = pgEnum(
    "notification_type",
    notificationTypeValues
);

export const deliveryStatusEnum = pgEnum(
    "delivery_status",
    deliveryStatusValues
);

export const blockReasonEnum = pgEnum("block_reason", blockReasonValues);

export const blockStatusEnum = pgEnum("block_status", blockStatusValues);

export const carColorEnum = pgEnum("car_color", carColors);
