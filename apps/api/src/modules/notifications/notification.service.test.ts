import { describe, it, expect } from "vitest";
import { db } from "../../db";
import { NotificationService } from "./notification.service";
import { NotificationErrorCodes } from "./notification.errors";
import { createTestUser } from "../../../test/factories";
import type { NotificationType } from "@repo/shared";

const createNotification = async (
    userId: string,
    type: NotificationType = "BOOKING_CONFIRMED"
) => {
    return await NotificationService.create(db, {
        userId,
        type,
        referenceEntityType: "BOOKING",
        referenceEntityId: crypto.randomUUID(),
        payload: { originCity: "Bratislava", destinationCity: "Trnava" },
    });
};

describe("NotificationService.create", () => {
    it("stores English fallback text, payload, and SENT delivery status", async () => {
        const user = await createTestUser();

        const { userId, notification } = await createNotification(user.id);

        expect(userId).toBe(user.id);
        expect(notification.title).toBe("Booking confirmed");
        expect(notification.body).toContain("Bratislava → Trnava");
        expect(notification.payload).toMatchObject({
            originCity: "Bratislava",
            destinationCity: "Trnava",
        });
        expect(notification.readAt).toBeNull();
    });
});

describe("NotificationService.listForUser", () => {
    it("returns only the user's notifications, newest first, and paginates with the cursor", async () => {
        const user = await createTestUser();
        const other = await createTestUser();

        const created = [];
        for (let i = 0; i < 3; i++) {
            created.push(await createNotification(user.id));
        }
        await createNotification(other.id);

        const all = await NotificationService.listForUser(user.id, 10);
        expect(all).toHaveLength(3);
        for (let i = 1; i < all.length; i++) {
            const previous = all[i - 1];
            const current = all[i];
            expect(previous.createdAt >= current.createdAt).toBe(true);
        }

        const firstPage = await NotificationService.listForUser(user.id, 2);
        expect(firstPage).toHaveLength(2);

        const cursor = firstPage[firstPage.length - 1];
        const secondPage = await NotificationService.listForUser(
            user.id,
            2,
            cursor.createdAt,
            cursor.id
        );
        expect(secondPage).toHaveLength(1);

        const seenIds = new Set([...firstPage, ...secondPage].map((n) => n.id));
        expect(seenIds.size).toBe(3);
        expect(created.every((c) => seenIds.has(c.notification.id))).toBe(true);
    });
});

describe("NotificationService.markRead", () => {
    it("flips readAt, updates the unread count, and is idempotent", async () => {
        const user = await createTestUser();
        const { notification } = await createNotification(user.id);

        await expect(
            NotificationService.getUnreadCount(user.id)
        ).resolves.toEqual({ count: 1 });

        const first = await NotificationService.markRead(
            notification.id,
            user.id
        );
        expect(first.readAt).toBeInstanceOf(Date);

        await expect(
            NotificationService.getUnreadCount(user.id)
        ).resolves.toEqual({ count: 0 });

        // Re-issuing the transition returns the existing readAt.
        const second = await NotificationService.markRead(
            notification.id,
            user.id
        );
        expect(second.readAt.getTime()).toBe(first.readAt.getTime());
    });

    it("throws NotFound for a random id and for another user's notification", async () => {
        const owner = await createTestUser();
        const stranger = await createTestUser();
        const { notification } = await createNotification(owner.id);

        await expect(
            NotificationService.markRead(crypto.randomUUID(), owner.id)
        ).rejects.toMatchObject({ code: NotificationErrorCodes.NotFound });

        await expect(
            NotificationService.markRead(notification.id, stranger.id)
        ).rejects.toMatchObject({ code: NotificationErrorCodes.NotFound });
    });
});

describe("NotificationService.markAllRead", () => {
    it("marks every unread notification and reports how many were updated", async () => {
        const user = await createTestUser();
        const other = await createTestUser();

        await createNotification(user.id);
        await createNotification(user.id);
        const { notification: alreadyRead } = await createNotification(user.id);
        await NotificationService.markRead(alreadyRead.id, user.id);
        await createNotification(other.id);

        await expect(NotificationService.markAllRead(user.id)).resolves.toEqual(
            { updated: 2 }
        );
        await expect(
            NotificationService.getUnreadCount(user.id)
        ).resolves.toEqual({ count: 0 });

        // Other users' notifications are untouched.
        await expect(
            NotificationService.getUnreadCount(other.id)
        ).resolves.toEqual({ count: 1 });
    });
});
