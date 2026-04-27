/**
 * Bridge between Eden treaty calls and TanStack Query.
 *
 * Eden returns { data, error, status } discriminated union; TanStack Query
 * expects queryFn to throw on failure and return data on success. Use unwrap
 * inside `queryFn` / `mutationFn` to translate.
 *
 * Example:
 *     useQuery({
 *         queryKey: ["cars", "brands"],
 *         queryFn: () => unwrap(api.cars.brands.get()),
 *     });
 */
export async function unwrap<T extends { data: unknown; error: unknown }>(
    promise: Promise<T>
): Promise<NonNullable<T["data"]>> {
    const { data, error } = await promise;
    if (error) {
        throw error;
    }
    return data as NonNullable<T["data"]>;
}
