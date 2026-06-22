import {
    useGetCarsBrands,
    useGetCarsBrandsByBrandModels,
} from "../../../../api-client/cars/cars";
import { carCatalog } from "@repo/shared/car-catalog";

const FALLBACK_CAR_BRANDS = Array.from(
    new Set(carCatalog.map((row) => row.brand))
).sort((a, b) => a.localeCompare(b));

/**
 * Brand/model option lists for the manual-car form. Prefers the live API
 * catalogue and falls back to the bundled `carCatalog` when the API has not
 * resolved (or returned nothing) yet, so the selects are never empty. Exposes
 * the raw model rows (`modelsData`) for the submit flow's model-id lookup.
 */
export function useCarCatalogOptions(manualBrand: string) {
    const brandsQuery = useGetCarsBrands();
    const modelsQuery = useGetCarsBrandsByBrandModels(manualBrand, {
        query: { enabled: Boolean(manualBrand) },
    });

    const apiCarBrandOptions =
        brandsQuery.data?.map((row) => row.brand).filter(Boolean) ?? [];
    const fallbackCarModelOptions = carCatalog
        .filter((row) => row.brand === manualBrand)
        .map((row) => row.modelName)
        .sort((a, b) => a.localeCompare(b));
    const apiCarModelOptions =
        modelsQuery.data?.map((row) => row.modelName).filter(Boolean) ?? [];

    const brandOptions =
        apiCarBrandOptions.length > 0
            ? apiCarBrandOptions
            : FALLBACK_CAR_BRANDS;
    const modelOptions =
        apiCarModelOptions.length > 0
            ? apiCarModelOptions
            : fallbackCarModelOptions;
    const brandLoading =
        brandsQuery.isLoading && apiCarBrandOptions.length === 0;
    const modelLoading =
        modelsQuery.isLoading &&
        apiCarModelOptions.length === 0 &&
        fallbackCarModelOptions.length === 0;

    return {
        brandOptions,
        modelOptions,
        brandLoading,
        modelLoading,
        modelsData: modelsQuery.data,
    };
}
