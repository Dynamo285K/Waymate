export const userStatusValues = [
    "PENDING",
    "ACTIVE",
    "SUSPENDED",
    "BANNED",
    "DELETED",
] as const;

export const rideStatusValues = [
    "PLANNED",
    "IN_PROGRESS",
    "COMPLETED",
    "CANCELLED",
] as const;

export const bookingStatusValues = [
    "PENDING",
    "CONFIRMED",
    "REJECTED",
    "CANCELLED",
    "COMPLETED",
    "NO_SHOW",
] as const;

export const reviewStatusValues = [
    "VISIBLE",
    "HIDDEN",
    "REMOVED",
] as const;

export const conversationTypeValues = [
    "RIDE",
    "BOOKING",
    "SUPPORT",
] as const;

export const messageTypeValues = ["TEXT", "SYSTEM"] as const;

export const notificationTypeValues = [
    "BOOKING_REQUEST",
    "BOOKING_CONFIRMED",
    "BOOKING_CANCELLED",
    "MESSAGE_RECEIVED",
    "RIDE_UPDATED",
    "REVIEW_RECEIVED",
] as const;

export const deliveryStatusValues = [
    "PENDING",
    "SENT",
    "FAILED",
    "READ",
] as const;

export const blockReasonValues = [
    "HARASSMENT",
    "SPAM",
    "SAFETY",
    "FRAUD",
    "ABUSE",
    "OTHER",
] as const;

export const blockStatusValues = ["ACTIVE", "REVOKED"] as const;
