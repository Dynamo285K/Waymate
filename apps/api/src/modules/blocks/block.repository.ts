import { and, desc, eq, isNull, or } from "drizzle-orm";
import type { Executor } from "../../db";
import { blocklist as blocklistTable } from "../../db/schema/blocklist";
import { users as usersTable } from "../../db/schema/user";
import type { BlockListItem } from "@repo/shared";
import type { BlockRow, CreateBlockInput } from "./block.types";

// An active block is one that is ACTIVE, not revoked, and not soft-deleted.
const activeBlock = and(
    eq(blocklistTable.blockStatus, "ACTIVE"),
    isNull(blocklistTable.revokedAt),
    isNull(blocklistTable.deletedAt)
);

// Does an active block exist in EITHER direction between two users? This is the
// enforcement primitive used by chat / bookings / search — a block is mutual
// for interaction regardless of who created it.
const existsActiveBlockBetween = async (
    executor: Executor,
    userA: string,
    userB: string
): Promise<boolean> => {
    const [row] = await executor
        .select({ id: blocklistTable.id })
        .from(blocklistTable)
        .where(
            and(
                activeBlock,
                or(
                    and(
                        eq(blocklistTable.blockerUserId, userA),
                        eq(blocklistTable.blockedUserId, userB)
                    ),
                    and(
                        eq(blocklistTable.blockerUserId, userB),
                        eq(blocklistTable.blockedUserId, userA)
                    )
                )
            )
        )
        .limit(1);

    return row !== undefined;
};

// The reporter's existing active block on a specific target, if any. Used to
// keep "block" idempotent (re-blocking is a no-op that returns the live row).
const findActiveBlockDirected = async (
    executor: Executor,
    blockerUserId: string,
    blockedUserId: string
): Promise<BlockRow | null> => {
    const [row] = await executor
        .select()
        .from(blocklistTable)
        .where(
            and(
                activeBlock,
                eq(blocklistTable.blockerUserId, blockerUserId),
                eq(blocklistTable.blockedUserId, blockedUserId)
            )
        )
        .limit(1);

    return row ?? null;
};

const createBlock = async (
    executor: Executor,
    input: CreateBlockInput
): Promise<{ id: string }> => {
    const [created] = await executor
        .insert(blocklistTable)
        .values({
            blockerUserId: input.blockerUserId,
            blockedUserId: input.blockedUserId,
            blockReason: input.reason,
            blockStatus: "ACTIVE",
            reasonText: input.reasonText ?? null,
        })
        .returning({ id: blocklistTable.id });

    return created;
};

// Revoke the reporter's active block on a target. Returns the number of rows
// affected so the service can distinguish "unblocked" from "nothing to do".
const revokeActiveBlock = async (
    executor: Executor,
    blockerUserId: string,
    blockedUserId: string,
    at: Date
): Promise<number> => {
    const updated = await executor
        .update(blocklistTable)
        .set({
            blockStatus: "REVOKED",
            revokedAt: at,
            revokedByUserId: blockerUserId,
        })
        .where(
            and(
                activeBlock,
                eq(blocklistTable.blockerUserId, blockerUserId),
                eq(blocklistTable.blockedUserId, blockedUserId)
            )
        )
        .returning({ id: blocklistTable.id });

    return updated.length;
};

const listBlocksByBlocker = async (
    executor: Executor,
    blockerUserId: string
): Promise<BlockListItem[]> => {
    return await executor
        .select({
            id: blocklistTable.id,
            reason: blocklistTable.blockReason,
            reasonText: blocklistTable.reasonText,
            createdAt: blocklistTable.createdAt,
            blockedUser: {
                id: usersTable.id,
                firstName: usersTable.firstName,
                lastName: usersTable.lastName,
                profilePhotoUrl: usersTable.profilePhotoUrl,
            },
        })
        .from(blocklistTable)
        .innerJoin(usersTable, eq(blocklistTable.blockedUserId, usersTable.id))
        .where(
            and(activeBlock, eq(blocklistTable.blockerUserId, blockerUserId))
        )
        .orderBy(desc(blocklistTable.createdAt));
};

const userExists = async (
    executor: Executor,
    userId: string
): Promise<boolean> => {
    const [row] = await executor
        .select({ id: usersTable.id })
        .from(usersTable)
        .where(and(eq(usersTable.id, userId), isNull(usersTable.deletedAt)))
        .limit(1);

    return row !== undefined;
};

export const BlockRepository = {
    existsActiveBlockBetween,
    findActiveBlockDirected,
    createBlock,
    revokeActiveBlock,
    listBlocksByBlocker,
    userExists,
};
