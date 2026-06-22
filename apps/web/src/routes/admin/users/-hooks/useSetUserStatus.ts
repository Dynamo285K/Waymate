import type { MutateOptions } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import {
    usePatchUsersAdminByIdStatus,
    getGetUsersAdminQueryKey,
    getGetUsersAdminByIdQueryKey,
} from "../../../../api-client/users/users";
import type { AdminUserListItem } from "../../../../api-client/model/adminUserListItem";
import type { AdminSettableUserStatus } from "../../../../api-client/model/adminSettableUserStatus";
import type { ApiMutationError } from "../../../../lib/api-fetcher";

type SetUserStatusInput = {
    userId: string;
    status: AdminSettableUserStatus;
    reason?: string;
};

type MutationVars = {
    id: string;
    data: { status: AdminSettableUserStatus; reason?: string };
};

export function useSetUserStatus() {
    const queryClient = useQueryClient();

    const mutation = usePatchUsersAdminByIdStatus<ApiMutationError>({
        mutation: {
            onSuccess: (_data, variables) => {
                void queryClient.invalidateQueries({
                    queryKey: getGetUsersAdminQueryKey(),
                });
                void queryClient.invalidateQueries({
                    queryKey: getGetUsersAdminByIdQueryKey(variables.id),
                });
            },
        },
    });

    const toVars = ({
        userId,
        status,
        reason,
    }: SetUserStatusInput): MutationVars => ({
        id: userId,
        data: { status, reason },
    });

    return {
        ...mutation,
        mutate: (
            input: SetUserStatusInput,
            options?: MutateOptions<
                AdminUserListItem,
                ApiMutationError,
                MutationVars,
                unknown
            >
        ) => mutation.mutate(toVars(input), options),
        mutateAsync: (
            input: SetUserStatusInput,
            options?: MutateOptions<
                AdminUserListItem,
                ApiMutationError,
                MutationVars,
                unknown
            >
        ) => mutation.mutateAsync(toVars(input), options),
    };
}
