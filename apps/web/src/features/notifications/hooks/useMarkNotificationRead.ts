import { useQueryClient } from "@tanstack/react-query";
import {
    usePatchNotificationsByIdRead,
    getGetNotificationsQueryKey,
    getGetNotificationsUnreadCountQueryKey,
} from "../../../api-client/notifications/notifications";
import type { ApiMutationError } from "../../../lib/api-fetcher";

export function useMarkNotificationRead() {
    const queryClient = useQueryClient();

    return usePatchNotificationsByIdRead<ApiMutationError>({
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
