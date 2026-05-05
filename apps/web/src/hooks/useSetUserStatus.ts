import type { MutateOptions } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import {
    usePatchAdminUsersByIdStatus,
    getGetAdminUsersQueryKey,
    getGetAdminUsersByIdQueryKey,
} from "../api-client/admin/admin";
import type { AdminUserListItem } from "../api-client/model/adminUserListItem";
import type { ErrorResponse } from "../api-client/model/errorResponse";
import type { UserStatus } from "../api-client/model/userStatus";
import { ApiError } from "../lib/api-fetcher";

type SetUserStatusInput = {
    userId: string;
    status: UserStatus;
    reason?: string;
};

type MutationVars = {
    id: string;
    data: { status: UserStatus; reason?: string };
};

// apiFetcher always throws ApiError, but Orval's generated default narrows
// TError to the response body shape (ErrorResponse). Override here so callers
// see the runtime type — instance checks, .status, .data all stay typed.
type MutationError = ApiError<ErrorResponse>;

export function useSetUserStatus() {
    const queryClient = useQueryClient();

    const mutation = usePatchAdminUsersByIdStatus<MutationError>({
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
                MutationError,
                MutationVars,
                unknown
            >
        ) => mutation.mutate(toVars(input), options),
        mutateAsync: (
            input: SetUserStatusInput,
            options?: MutateOptions<
                AdminUserListItem,
                MutationError,
                MutationVars,
                unknown
            >
        ) => mutation.mutateAsync(toVars(input), options),
    };
}
