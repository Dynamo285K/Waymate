import { useTranslation } from "react-i18next";
import { getErrorI18nKey } from "../../../../../lib/api-errors";

type RideSearchStatusProps = {
    showAllRides: boolean;
    hasSearchParams: boolean;
    canSearch: boolean;
    count: number;
    areAvailableRidesLoading: boolean;
    areAvailableRidesError: boolean;
    availableRidesError: unknown;
    isLoading: boolean;
    isError: boolean;
    searchError: unknown;
};

// Renders the various "found N", loading, error and empty-params status lines
// above the results list. Pure presentation driven by the page's query flags.
export function RideSearchStatus({
    showAllRides,
    hasSearchParams,
    canSearch,
    count,
    areAvailableRidesLoading,
    areAvailableRidesError,
    availableRidesError,
    isLoading,
    isError,
    searchError,
}: RideSearchStatusProps) {
    const { t } = useTranslation();

    return (
        <>
            {showAllRides && (
                <p className="text-(--color-text-secondary) mt-1 mb-8">
                    {t("rides.found", { count })}
                </p>
            )}

            {showAllRides && areAvailableRidesLoading && (
                <p className="text-(--color-text-secondary) mt-1">
                    {t("rides.loading")}
                </p>
            )}

            {showAllRides && areAvailableRidesError && (
                <p className="text-(--color-text-secondary) mt-4">
                    {t(getErrorI18nKey(availableRidesError, {}, "rides.error"))}
                </p>
            )}

            {hasSearchParams && !canSearch && (
                <p className="text-(--color-text-secondary) mt-1">
                    {t("rides.noSearchParams")}
                </p>
            )}

            {canSearch && isLoading && (
                <p className="text-(--color-text-secondary) mt-1">
                    {t("rides.loading")}
                </p>
            )}

            {canSearch && !isLoading && !isError && (
                <p className="text-(--color-text-secondary) mt-1 mb-8">
                    {t("rides.found", { count })}
                </p>
            )}

            {canSearch && !isLoading && isError && (
                <p className="text-(--color-text-secondary) mt-4">
                    {t(getErrorI18nKey(searchError, {}, "rides.error"))}
                </p>
            )}
        </>
    );
}
