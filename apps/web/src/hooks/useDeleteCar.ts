import { useQueryClient } from "@tanstack/react-query";
import {
    useDeleteCarsById,
    getGetCarsMeQueryKey,
} from "../api-client/cars/cars";
import type { ApiMutationError } from "../lib/api-fetcher";

export function useDeleteCar() {
    const queryClient = useQueryClient();

    const mutation = useDeleteCarsById<ApiMutationError>({
        mutation: {
            onSuccess: () => {
                void queryClient.invalidateQueries({
                    queryKey: getGetCarsMeQueryKey(),
                });
            },
        },
    });

    return {
        ...mutation,
        mutate: (carId: string) => mutation.mutate({ id: carId }),
        mutateAsync: (carId: string) => mutation.mutateAsync({ id: carId }),
    };
}
