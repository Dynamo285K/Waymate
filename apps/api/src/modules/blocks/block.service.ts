import { db } from "../../db";
import type { Executor } from "../../db";
import { BlockRepository } from "./block.repository";
import { BlockError, BlockErrorCodes } from "./block.errors";
import type { BlockListItem, BlockReason } from "@repo/shared";

type BlockUserInput = {
    blockerId: string;
    blockedUserId: string;
    reason: BlockReason;
    reasonText?: string | null;
};

// Add a user to the caller's personal block list. Idempotent: re-blocking an
// already-blocked user returns the existing block instead of creating a
// duplicate. Pass an executor to enrol the write in a caller's transaction
// (e.g. "report & block" runs inside the report transaction).
const blockUser = async (
    input: BlockUserInput,
    executor: Executor = db
): Promise<{ id: string }> => {
    if (input.blockerId === input.blockedUserId) {
        throw new BlockError(BlockErrorCodes.CannotBlockSelf);
    }

    const exists = await BlockRepository.userExists(
        executor,
        input.blockedUserId
    );
    if (!exists) {
        throw new BlockError(BlockErrorCodes.TargetNotFound);
    }

    const existing = await BlockRepository.findActiveBlockDirected(
        executor,
        input.blockerId,
        input.blockedUserId
    );
    if (existing) {
        return { id: existing.id };
    }

    return await BlockRepository.createBlock(executor, {
        blockerUserId: input.blockerId,
        blockedUserId: input.blockedUserId,
        reason: input.reason,
        reasonText: input.reasonText ?? null,
    });
};

const unblockUser = async (
    blockerId: string,
    blockedUserId: string
): Promise<{ blockedUserId: string }> => {
    const affected = await BlockRepository.revokeActiveBlock(
        db,
        blockerId,
        blockedUserId,
        new Date()
    );
    if (affected === 0) {
        throw new BlockError(BlockErrorCodes.NotBlocked);
    }
    return { blockedUserId };
};

const listBlocks = async (blockerId: string): Promise<BlockListItem[]> => {
    return await BlockRepository.listBlocksByBlocker(db, blockerId);
};

// Enforcement helper for other modules (chat / bookings / search): is there an
// active block in either direction between two users?
const isBlockedBetween = async (
    userA: string,
    userB: string,
    executor: Executor = db
): Promise<boolean> => {
    return await BlockRepository.existsActiveBlockBetween(executor, userA, userB);
};

export const BlockService = {
    blockUser,
    unblockUser,
    listBlocks,
    isBlockedBetween,
};
