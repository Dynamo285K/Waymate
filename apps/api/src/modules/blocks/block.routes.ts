import { Elysia } from "elysia";
import { BlockService } from "./block.service";
import { isFullyOnboarded } from "../auth/auth.middleware";
import {
    ErrorResponseSchema,
    CreateBlockBodySchema,
    BlockedUserIdParamsSchema,
    BlockActionResponseSchema,
    BlockListSchema,
    UnblockResponseSchema,
} from "@repo/shared";

export const BlockRoutes = new Elysia({ prefix: "/blocks", tags: ["Blocks"] })
    .model({
        CreateBlockBody: CreateBlockBodySchema,
        BlockedUserIdParams: BlockedUserIdParamsSchema,
        BlockActionResponse: BlockActionResponseSchema,
        BlockList: BlockListSchema,
        UnblockResponse: UnblockResponseSchema,
        ErrorResponse: ErrorResponseSchema,
    })
    .use(isFullyOnboarded)
    .guard({ auth: true, onboarded: true }, (app) =>
        app
            .get(
                "/",
                async ({ user }) => await BlockService.listBlocks(user.id),
                {
                    response: {
                        200: "BlockList",
                        429: "ErrorResponse",
                        500: "ErrorResponse",
                    },
                    detail: {
                        description:
                            "Lists the users the authenticated user has blocked.",
                    },
                }
            )

            .post(
                "/",
                async ({ user, body, status }) => {
                    const result = await BlockService.blockUser({
                        blockerId: user.id,
                        blockedUserId: body.blockedUserId,
                        reason: body.reason,
                        reasonText: body.reasonText,
                    });
                    return status(201, result);
                },
                {
                    body: "CreateBlockBody",
                    response: {
                        201: "BlockActionResponse",
                        400: "ErrorResponse",
                        404: "ErrorResponse",
                        413: "ErrorResponse",
                        429: "ErrorResponse",
                        500: "ErrorResponse",
                    },
                    detail: {
                        description:
                            "Blocks a user. Idempotent — re-blocking returns the existing block. Stops chat, bookings, and search visibility between the two.",
                    },
                }
            )

            .delete(
                "/:blockedUserId",
                async ({ user, params }) =>
                    await BlockService.unblockUser(
                        user.id,
                        params.blockedUserId
                    ),
                {
                    params: BlockedUserIdParamsSchema,
                    response: {
                        200: "UnblockResponse",
                        404: "ErrorResponse",
                        429: "ErrorResponse",
                        500: "ErrorResponse",
                    },
                    detail: {
                        description:
                            "Removes a user from the authenticated user's block list.",
                    },
                }
            )
    );
