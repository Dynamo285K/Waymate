import { z } from "zod";
import { blockReasonValues } from "./status-values";
import { PublicUserPreviewSchema, UserIdSchema } from "./user.schema";

export const BlockedUserIdParamsSchema = z.object({
    blockedUserId: UserIdSchema,
});

export const BlockReasonSchema = z.enum(blockReasonValues);

export const CreateBlockBodySchema = z.object({
    blockedUserId: UserIdSchema,
    reason: BlockReasonSchema.default("OTHER"),
    reasonText: z.string().trim().max(500).optional(),
});

export const BlockActionResponseSchema = z.object({
    id: z.uuid(),
});

export const UnblockResponseSchema = z.object({
    blockedUserId: UserIdSchema,
});

export const BlockListItemSchema = z.object({
    id: z.uuid(),
    blockedUser: PublicUserPreviewSchema,
    reason: BlockReasonSchema,
    reasonText: z.string().nullable(),
    createdAt: z.date(),
});

export const BlockListSchema = BlockListItemSchema.array();

export type BlockReason = z.infer<typeof BlockReasonSchema>;
export type CreateBlockBody = z.infer<typeof CreateBlockBodySchema>;
export type BlockListItem = z.infer<typeof BlockListItemSchema>;
