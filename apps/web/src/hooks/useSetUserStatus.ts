import type { MutateOptions } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import {
    usePatchAdminUsersByIdStatus,
    getGetAdminUsersQueryKey,
    getGetAdminUsersByIdQueryKey,
} from "../api-client/admin/admin";
import type { AdminUserListItem } from "../api-client/model/adminUserListItem";
import type { UserStatus } from "../api-client/model/userStatus";
import type { ApiMutationError } from "../lib/api-fetcher";

type SetUserStatusInput = {
    userId: string;
    status: UserStatus;
    reason?: string;
};

type MutationVars = {
    id: string;
    data: { status: UserStatus; reason?: string };
};

export function useSetUserStatus() {
    const queryClient = useQueryClient();

    const mutation = usePatchAdminUsersByIdStatus<ApiMutationError>({
        mutation: {
            onSuccess: (_data, variables) => {
                void queryClient.invalidateQueries({
                    queryKey: getGetAdminUsersQueryKey(),
                });
                void queryClient.invalidateQueries({
                    queryKey: getGetAdminUsersByIdQueryKey(variables.id),
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
