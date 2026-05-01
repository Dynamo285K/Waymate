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
    role: UserRole;
};

type MutationVars = { id: string; data: { role: UserRole } };

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

    const toVars = ({ userId, role }: SetUserRoleInput): MutationVars => ({
        id: userId,
        data: { role },
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
