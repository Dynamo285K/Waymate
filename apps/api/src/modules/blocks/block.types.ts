import type { InferSelectModel } from "drizzle-orm";
import type { blocklist } from "../../db/schema/blocklist";
import type { BlockReason } from "@repo/shared";

export type BlockRow = InferSelectModel<typeof blocklist>;

export type CreateBlockInput = {
    blockerUserId: string;
    blockedUserId: string;
    reason: BlockReason;
    reasonText?: string | null;
};
