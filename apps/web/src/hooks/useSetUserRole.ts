import type { MutateOptions } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import {
    usePatchAdminUsersByIdRole,
    getGetAdminUsersQueryKey,
    getGetAdminUsersByIdQueryKey,
} from "../api-client/admin/admin";
import type { AdminUserListItem } from "../api-client/model/adminUserListItem";
import type { UserRole } from "../api-client/model/userRole";

type SetUserRoleInput = {
    userId: string;
    userRole: UserRole;
};

type MutationVars = { id: string; data: { userRole: UserRole } };

export function useSetUserRole() {
    const queryClient = useQueryClient();

    const mutation = usePatchAdminUsersByIdRole({
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

    const toVars = ({ userId, userRole }: SetUserRoleInput): MutationVars => ({
        id: userId,
        data: { userRole },
    });

    return {
        ...mutation,
        mutate: (
            input: SetUserRoleInput,
            options?: MutateOptions<
                AdminUserListItem,
                unknown,
                MutationVars,
                unknown
            >
        ) => mutation.mutate(toVars(input), options),
        mutateAsync: (
            input: SetUserRoleInput,
            options?: MutateOptions<
                AdminUserListItem,
                unknown,
                MutationVars,
                unknown
            >
        ) => mutation.mutateAsync(toVars(input), options),
    };
}
