import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { Avatar, Button } from "@waymate/ui";
import {
    useGetBlocks,
    useDeleteBlocksByBlockedUserId,
    getGetBlocksQueryKey,
} from "../../api-client/blocks/blocks";

function displayName(
    firstName: string | null,
    lastName: string | null,
    fallback: string
): string {
    return [firstName, lastName].filter(Boolean).join(" ").trim() || fallback;
}

// Lists the users the current user has blocked, with an unblock action. Renders
// nothing when the list is empty, so it only appears on the profile once there
// is something to manage.
export function BlockedUsersSection() {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const { data: blocks } = useGetBlocks();

    const unblock = useDeleteBlocksByBlockedUserId({
        mutation: {
            onSuccess: () =>
                queryClient.invalidateQueries({
                    queryKey: getGetBlocksQueryKey(),
                }),
        },
    });

    if (!blocks || blocks.length === 0) return null;

    return (
        <div className="bg-(--color-card) rounded-2xl p-6 border border-(--color-border)">
            <h2 className="text-base font-semibold text-(--color-text-primary) mb-4">
                {t("blocked.title")}
            </h2>
            <ul className="flex flex-col gap-3">
                {blocks.map((block) => {
                    const name = displayName(
                        block.blockedUser.firstName,
                        block.blockedUser.lastName,
                        t("chat.unknownUser")
                    );
                    const pending =
                        unblock.isPending &&
                        unblock.variables?.blockedUserId ===
                            block.blockedUser.id;

                    return (
                        <li
                            key={block.id}
                            className="flex items-center justify-between gap-3"
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <Avatar
                                    name={name}
                                    size="sm"
                                />
                                <span className="text-sm font-medium text-(--color-text-primary) truncate">
                                    {name}
                                </span>
                            </div>
                            <Button
                                variant="secondary"
                                onClick={() =>
                                    unblock.mutate({
                                        blockedUserId: block.blockedUser.id,
                                    })
                                }
                                disabled={pending}
                            >
                                {t("blocked.unblock")}
                            </Button>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
