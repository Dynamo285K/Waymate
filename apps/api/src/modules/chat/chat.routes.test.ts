import { describe, it, expect } from "vitest";
import { apiRequest, jsonRequest } from "../../../test/http";
import {
    authenticatedRequest,
    createSignedInUser,
} from "../../../test/auth-helpers";
import { createRideContext } from "../../../test/factories";

/**
 * Route-level coverage for the parts the service tests can't reach: the auth /
 * onboarding guards and the request-validation layer (the 2000-char content cap
 * lives only in the Zod body schema — there is no DB CHECK behind it, so this is
 * the sole line of defence and must be tested at the edge).
 */
async function sharedConversation() {
    const ctx = await createRideContext({ withPassenger: true });
    const created = await authenticatedRequest(
        "/conversations",
        ctx.driverCookie,
        jsonRequest({ bookingId: ctx.bookingId })
    );
    const { id: conversationId } = (await created.json()) as { id: string };
    return { ctx, conversationId, createStatus: created.status };
}

describe("ChatRoutes — guards", () => {
    it("returns 401 for GET /conversations without a session", async () => {
        const response = await apiRequest("/conversations");
        expect(response.status).toBe(401);
        await expect(response.json()).resolves.toEqual({
            error: "UNAUTHORIZED",
        });
    });

    it("returns 403 ONBOARDING_REQUIRED for a non-onboarded user", async () => {
        const { cookie } = await createSignedInUser({ onboarded: false });
        const response = await authenticatedRequest("/conversations", cookie);
        expect(response.status).toBe(403);
        await expect(response.json()).resolves.toEqual({
            error: "ONBOARDING_REQUIRED",
        });
    });
});

describe("ChatRoutes — message validation", () => {
    it("opens a conversation, then accepts a normal message (201)", async () => {
        const { ctx, conversationId, createStatus } =
            await sharedConversation();
        expect(createStatus).toBe(201);

        const response = await authenticatedRequest(
            `/conversations/${conversationId}/messages`,
            ctx.passengerCookie!,
            jsonRequest({ content: "hello driver" })
        );
        expect(response.status).toBe(201);
        const message = (await response.json()) as { content: string };
        expect(message.content).toBe("hello driver");
    });

    it("rejects an empty message with 400 VALIDATION", async () => {
        const { ctx, conversationId } = await sharedConversation();

        const response = await authenticatedRequest(
            `/conversations/${conversationId}/messages`,
            ctx.driverCookie,
            jsonRequest({ content: "   " })
        );
        expect(response.status).toBe(400);
        await expect(response.json()).resolves.toEqual({
            error: "VALIDATION",
        });
    });

    it("rejects an over-2000-character message with 400 VALIDATION", async () => {
        const { ctx, conversationId } = await sharedConversation();

        const response = await authenticatedRequest(
            `/conversations/${conversationId}/messages`,
            ctx.driverCookie,
            jsonRequest({ content: "x".repeat(2001) })
        );
        expect(response.status).toBe(400);
        await expect(response.json()).resolves.toEqual({
            error: "VALIDATION",
        });
    });

    it("accepts a message at exactly the 2000-character limit", async () => {
        const { ctx, conversationId } = await sharedConversation();

        const response = await authenticatedRequest(
            `/conversations/${conversationId}/messages`,
            ctx.driverCookie,
            jsonRequest({ content: "x".repeat(2000) })
        );
        expect(response.status).toBe(201);
    });
});

describe("ChatRoutes — authorization", () => {
    it("returns 403 when a non-participant reads the messages", async () => {
        const { conversationId } = await sharedConversation();
        const outsider = await createSignedInUser();

        const response = await authenticatedRequest(
            `/conversations/${conversationId}/messages`,
            outsider.cookie
        );
        expect(response.status).toBe(403);
        await expect(response.json()).resolves.toEqual({
            error: "CHAT_NOT_A_PARTICIPANT",
        });
    });
});
