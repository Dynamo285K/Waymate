import { describe, it, expect } from "vitest";
import { and, eq } from "drizzle-orm";
import { db } from "../../db";
import { blocklist } from "../../db/schema";
import { BlockService } from "./block.service";
import { BlockErrorCodes } from "./block.errors";
import { createTestUser } from "../../../test/factories";

describe("BlockService.blockUser", () => {
    it("creates an active block and reports it in both directions", async () => {
        const blocker = await createTestUser();
        const blocked = await createTestUser();

        const { id } = await BlockService.blockUser({
            blockerId: blocker.id,
            blockedUserId: blocked.id,
            reason: "HARASSMENT",
        });

        expect(id).toEqual(expect.any(String));
        await expect(
            BlockService.isBlockedBetween(blocker.id, blocked.id)
        ).resolves.toBe(true);
        // The block is mutual for interaction regardless of who created it.
        await expect(
            BlockService.isBlockedBetween(blocked.id, blocker.id)
        ).resolves.toBe(true);
    });

    it("rejects blocking yourself", async () => {
        const user = await createTestUser();

        await expect(
            BlockService.blockUser({
                blockerId: user.id,
                blockedUserId: user.id,
                reason: "OTHER",
            })
        ).rejects.toMatchObject({ code: BlockErrorCodes.CannotBlockSelf });
    });

    it("rejects blocking a user that does not exist", async () => {
        const blocker = await createTestUser();

        await expect(
            BlockService.blockUser({
                blockerId: blocker.id,
                blockedUserId: crypto.randomUUID(),
                reason: "OTHER",
            })
        ).rejects.toMatchObject({ code: BlockErrorCodes.TargetNotFound });
    });

    it("is idempotent — re-blocking returns the existing block, no duplicate row", async () => {
        const blocker = await createTestUser();
        const blocked = await createTestUser();

        const first = await BlockService.blockUser({
            blockerId: blocker.id,
            blockedUserId: blocked.id,
            reason: "SPAM",
        });
        const second = await BlockService.blockUser({
            blockerId: blocker.id,
            blockedUserId: blocked.id,
            reason: "FRAUD",
        });

        expect(second.id).toBe(first.id);

        const rows = await db
            .select({ id: blocklist.id })
            .from(blocklist)
            .where(
                and(
                    eq(blocklist.blockerUserId, blocker.id),
                    eq(blocklist.blockedUserId, blocked.id)
                )
            );
        expect(rows).toHaveLength(1);
    });
});

describe("BlockService.unblockUser", () => {
    it("revokes the block so the pair is no longer blocked", async () => {
        const blocker = await createTestUser();
        const blocked = await createTestUser();

        await BlockService.blockUser({
            blockerId: blocker.id,
            blockedUserId: blocked.id,
            reason: "OTHER",
        });

        const result = await BlockService.unblockUser(blocker.id, blocked.id);
        expect(result).toEqual({ blockedUserId: blocked.id });

        await expect(
            BlockService.isBlockedBetween(blocker.id, blocked.id)
        ).resolves.toBe(false);
    });

    it("throws NotBlocked when there is nothing to revoke", async () => {
        const blocker = await createTestUser();
        const blocked = await createTestUser();

        await expect(
            BlockService.unblockUser(blocker.id, blocked.id)
        ).rejects.toMatchObject({ code: BlockErrorCodes.NotBlocked });
    });

    it("only revokes the caller's own direction", async () => {
        const a = await createTestUser();
        const b = await createTestUser();

        // A blocks B. B has never blocked A, so B unblocking A is a no-op.
        await BlockService.blockUser({
            blockerId: a.id,
            blockedUserId: b.id,
            reason: "OTHER",
        });

        await expect(
            BlockService.unblockUser(b.id, a.id)
        ).rejects.toMatchObject({ code: BlockErrorCodes.NotBlocked });

        // A's block is still in force.
        await expect(BlockService.isBlockedBetween(a.id, b.id)).resolves.toBe(
            true
        );
    });

    it("lets a user re-block after unblocking", async () => {
        const blocker = await createTestUser();
        const blocked = await createTestUser();

        await BlockService.blockUser({
            blockerId: blocker.id,
            blockedUserId: blocked.id,
            reason: "OTHER",
        });
        await BlockService.unblockUser(blocker.id, blocked.id);
        const reblock = await BlockService.blockUser({
            blockerId: blocker.id,
            blockedUserId: blocked.id,
            reason: "OTHER",
        });

        expect(reblock.id).toEqual(expect.any(String));
        await expect(
            BlockService.isBlockedBetween(blocker.id, blocked.id)
        ).resolves.toBe(true);
    });
});

describe("BlockService.isBlockedBetween", () => {
    it("is false when no block exists", async () => {
        const a = await createTestUser();
        const b = await createTestUser();

        await expect(BlockService.isBlockedBetween(a.id, b.id)).resolves.toBe(
            false
        );
    });
});

describe("BlockService.getBlockDirection", () => {
    it("returns BY_ME when the caller blocked the other user", async () => {
        const caller = await createTestUser();
        const other = await createTestUser();

        await BlockService.blockUser({
            blockerId: caller.id,
            blockedUserId: other.id,
            reason: "OTHER",
        });

        await expect(
            BlockService.getBlockDirection(caller.id, other.id)
        ).resolves.toBe("BY_ME");
    });

    it("returns BY_OTHER when the other user blocked the caller", async () => {
        const caller = await createTestUser();
        const other = await createTestUser();

        await BlockService.blockUser({
            blockerId: other.id,
            blockedUserId: caller.id,
            reason: "OTHER",
        });

        await expect(
            BlockService.getBlockDirection(caller.id, other.id)
        ).resolves.toBe("BY_OTHER");
    });

    it("returns null when neither side blocked the other", async () => {
        const caller = await createTestUser();
        const other = await createTestUser();

        await expect(
            BlockService.getBlockDirection(caller.id, other.id)
        ).resolves.toBeNull();
    });

    it("prefers BY_ME when the block is mutual (the actionable direction)", async () => {
        const caller = await createTestUser();
        const other = await createTestUser();

        await BlockService.blockUser({
            blockerId: caller.id,
            blockedUserId: other.id,
            reason: "OTHER",
        });
        await BlockService.blockUser({
            blockerId: other.id,
            blockedUserId: caller.id,
            reason: "OTHER",
        });

        await expect(
            BlockService.getBlockDirection(caller.id, other.id)
        ).resolves.toBe("BY_ME");
    });
});

describe("BlockService.listBlocks", () => {
    it("lists only the caller's active blocks, newest first", async () => {
        const blocker = await createTestUser();
        const first = await createTestUser({ name: "First Blocked" });
        const second = await createTestUser({ name: "Second Blocked" });

        await BlockService.blockUser({
            blockerId: blocker.id,
            blockedUserId: first.id,
            reason: "OTHER",
        });
        await BlockService.blockUser({
            blockerId: blocker.id,
            blockedUserId: second.id,
            reason: "SAFETY",
        });

        const blocks = await BlockService.listBlocks(blocker.id);

        expect(blocks).toHaveLength(2);
        // Ordered by createdAt desc — the most recently blocked user is first.
        expect(blocks[0]!.blockedUser.id).toBe(second.id);
        expect(blocks[1]!.blockedUser.id).toBe(first.id);
    });

    it("excludes revoked blocks", async () => {
        const blocker = await createTestUser();
        const blocked = await createTestUser();

        await BlockService.blockUser({
            blockerId: blocker.id,
            blockedUserId: blocked.id,
            reason: "OTHER",
        });
        await BlockService.unblockUser(blocker.id, blocked.id);

        await expect(BlockService.listBlocks(blocker.id)).resolves.toEqual([]);
    });

    it("does not leak blocks created by other users", async () => {
        const blocker = await createTestUser();
        const otherBlocker = await createTestUser();
        const blocked = await createTestUser();

        await BlockService.blockUser({
            blockerId: otherBlocker.id,
            blockedUserId: blocked.id,
            reason: "OTHER",
        });

        await expect(BlockService.listBlocks(blocker.id)).resolves.toEqual([]);
    });
});
