import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSetUserStatus } from "./useSetUserStatus";
import { getGetUsersAdminQueryKey } from "../../../../api-client/users/users";
import type { AdminUserListItem } from "../../../../api-client/model/adminUserListItem";
import { getErrorCode } from "../../../../lib/api-errors";
import { ADMIN_USER_NOT_FOUND_CODE } from "../-lib/admin-errors";

// Owns the detail / ban modal orchestration and the ban/unban mutation for the
// admin-users page, so the route file stays a lean orchestrator. `items` lets
// the detail modal hand back the selected id and have it resolved to the full
// row needed by the ban/unban flows.
export function useAdminUsersActions(items: AdminUserListItem[]) {
    const queryClient = useQueryClient();

    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [banTarget, setBanTarget] = useState<AdminUserListItem | null>(null);

    const setUserStatus = useSetUserStatus();

    // The mutation hook exposes `variables` from the underlying mutation,
    // which is the toVars-mapped shape `{ id, data: { ... } }`.
    const statusMutatingId = setUserStatus.isPending
        ? (setUserStatus.variables?.id ?? null)
        : null;

    const errorTargetForStatus = setUserStatus.isError
        ? (setUserStatus.variables?.id ?? null)
        : null;

    const detailErrorForUser =
        selectedUserId && errorTargetForStatus === selectedUserId
            ? setUserStatus.error
            : null;
    const banErrorForTarget =
        banTarget && errorTargetForStatus === banTarget.id
            ? setUserStatus.error
            : null;

    const detailIsMutating =
        selectedUserId !== null && statusMutatingId === selectedUserId;

    const handleMutationFailure = useCallback(
        (error: unknown) => {
            if (getErrorCode(error) === ADMIN_USER_NOT_FOUND_CODE) {
                void queryClient.invalidateQueries({
                    queryKey: getGetUsersAdminQueryKey(),
                });
                setSelectedUserId(null);
                setBanTarget(null);
            }
        },
        [queryClient]
    );

    const handleConfirmBan = (reason: string | undefined) => {
        if (!banTarget) return;
        setUserStatus.mutate(
            { userId: banTarget.id, status: "BANNED", reason },
            {
                onSuccess: () => setBanTarget(null),
                onError: handleMutationFailure,
            }
        );
    };

    const handleUnban = (target: AdminUserListItem) => {
        setUserStatus.mutate(
            { userId: target.id, status: "ACTIVE" },
            { onError: handleMutationFailure }
        );
    };

    // Centralized open/close so any prior mutation state from a different
    // target is cleared before the modal sees a fresh row. The `key` prop on
    // each modal also blows away its local UI state on target switch, so no
    // useEffect-on-prop-change is needed inside the modals.
    const openDetail = (id: string | null) => {
        setUserStatus.reset();
        setSelectedUserId(id);
    };

    const openBan = (target: AdminUserListItem | null) => {
        setUserStatus.reset();
        setBanTarget(target);
    };

    // The detail modal acts on whichever user is currently selected; resolve it
    // to the full row before driving the ban/unban flows.
    const banSelectedUser = () => {
        const target = items.find((u) => u.id === selectedUserId);
        if (target) {
            setSelectedUserId(null);
            openBan(target);
        }
    };

    const unbanSelectedUser = () => {
        const target = items.find((u) => u.id === selectedUserId);
        if (target) handleUnban(target);
    };

    return {
        statusMutatingId,
        // detail modal
        selectedUserId,
        detailIsMutating,
        detailErrorForUser,
        openDetail,
        banSelectedUser,
        unbanSelectedUser,
        // ban modal
        banTarget,
        banModalIsPending: banTarget
            ? statusMutatingId === banTarget.id
            : false,
        banErrorForTarget,
        handleConfirmBan,
        closeBanModal: () => openBan(null),
        // table row actions
        openBan,
        handleUnban,
    };
}
