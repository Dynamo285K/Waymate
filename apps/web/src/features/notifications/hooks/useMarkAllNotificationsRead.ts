import { useQueryClient } from "@tanstack/react-query";
import {
    usePatchNotificationsReadAll,
    getGetNotificationsQueryKey,
    getGetNotificationsUnreadCountQueryKey,
} from "../../../api-client/notifications/notifications";
import type { ApiMutationError } from "../../../lib/api-fetcher";

export function useMarkAllNotificationsRead() {
    const queryClient = useQueryClient();

    return usePatchNotificationsReadAll<ApiMutationError>({
        mutation: {
            onSuccess: () => {
                void queryClient.invalidateQueries({
                    queryKey: getGetNotificationsQueryKey(),
                });
                void queryClient.invalidateQueries({
                    queryKey: getGetNotificationsUnreadCountQueryKey(),
                });
            },
        },
    });
}
