import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@waymate/ui";
import type { Language } from "../../components/controls/LanguageSwitcher";
import { AdminNavbar } from "../../components/navigation/AdminNavbar";
import { useAdminNavbarProps } from "../../features/admin/hooks/useAdminNavbarProps";
import { useAdminCancelRide } from "./-rides/hooks/useAdminCancelRide";
import { getGetAdminRidesQueryKey } from "../../api-client/admin/admin";
import type { AdminRideListItem } from "../../api-client/model/adminRideListItem";
import type { RideStatus } from "../../api-client/model/rideStatus";
import { getErrorCode, getErrorI18nKey } from "../../lib/api-errors";
import { AdminRidesFilters } from "./-rides/components/AdminRidesFilters";
import { AdminRidesTable } from "./-rides/components/AdminRidesTable";
import { CancelRideModal } from "./-rides/components/CancelRideModal";
import { RideDetailModal } from "./-rides/components/RideDetailModal";
import { useAdminRidesList } from "./-rides/hooks/useAdminRidesList";
import { useDebounced } from "../../hooks/shared/useDebounced";
import {
    ADMIN_RIDE_NOT_FOUND_CODE,
    adminRidesErrorMap,
} from "./-rides/lib/admin-ride-errors";
import { requireAudience } from "../../lib/route-guards";
import { makeAudienceComponent } from "../../lib/make-audience-component";

export const Route = createFileRoute("/admin/rides")({
    beforeLoad: requireAudience(["admin"]),
    component: makeAudienceComponent(AdminRidesPage),
});

type AdminRidesPageProps = {
    language: Language;
    theme: "light" | "dark";
    onLanguageChange: (lang: Language) => void;
    onThemeToggle: () => void;
    userName?: string;
    userEmail?: string;
};

type StatusFilter = "ALL" | RideStatus;

const SEARCH_DEBOUNCE_MS = 300;

export function AdminRidesPage({
    language,
    theme,
    onLanguageChange,
    onThemeToggle,
    userName,
    userEmail,
}: AdminRidesPageProps) {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const navbarProps = useAdminNavbarProps({
        activeTab: "rides",
        language,
        onLanguageChange,
        theme,
        onThemeToggle,
        userName,
        userEmail,
    });

    const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
    const [searchInput, setSearchInput] = useState("");
    const debouncedSearch = useDebounced(searchInput, SEARCH_DEBOUNCE_MS);

    const trimmedSearch = debouncedSearch.trim();
    const list = useAdminRidesList({
        status: statusFilter === "ALL" ? undefined : statusFilter,
        search: trimmedSearch.length > 0 ? trimmedSearch : undefined,
    });

    const [selectedRideId, setSelectedRideId] = useState<string | null>(null);
    const [cancelTarget, setCancelTarget] = useState<AdminRideListItem | null>(
        null
    );

    const cancelRide = useAdminCancelRide();

    const rowMutatingId = cancelRide.isPending
        ? (cancelRide.variables?.id ?? null)
        : null;

    const errorTargetForCancel = cancelRide.isError
        ? (cancelRide.variables?.id ?? null)
        : null;

    const detailErrorForRide =
        selectedRideId && errorTargetForCancel === selectedRideId
            ? cancelRide.error
            : null;
    const cancelErrorForTarget =
        cancelTarget && errorTargetForCancel === cancelTarget.id
            ? cancelRide.error
            : null;

    const detailIsMutating =
        selectedRideId !== null && rowMutatingId === selectedRideId;

    const handleMutationFailure = useCallback(
        (error: unknown) => {
            // If the ride disappeared (deleted, race), drop the open UI and
            // refresh the list — same pattern as the users page handles
            // ADMIN_USER_NOT_FOUND.
            if (getErrorCode(error) === ADMIN_RIDE_NOT_FOUND_CODE) {
                void queryClient.invalidateQueries({
                    queryKey: getGetAdminRidesQueryKey(),
                });
                setSelectedRideId(null);
                setCancelTarget(null);
            }
        },
        [queryClient]
    );

    const handleConfirmCancel = (reason: string) => {
        if (!cancelTarget) return;
        cancelRide.mutate(
            { rideId: cancelTarget.id, reason },
            {
                onSuccess: () => setCancelTarget(null),
                onError: handleMutationFailure,
            }
        );
    };

    const openDetail = (id: string | null) => {
        cancelRide.reset();
        setSelectedRideId(id);
    };

    const openCancel = (target: AdminRideListItem | null) => {
        cancelRide.reset();
        setCancelTarget(target);
    };

    return (
        <div
            data-theme={theme}
            className="min-h-screen bg-(--color-bg)"
        >
            <AdminNavbar {...navbarProps} />

            <div className="w-full px-4 sm:max-w-6xl sm:mx-auto sm:px-8 py-8">
                <h1 className="text-2xl font-bold text-(--color-text-primary)">
                    {t("admin.ridesTitle")}
                </h1>
                <p className="text-(--color-text-secondary) text-sm mt-1 mb-6">
                    {t("admin.ridesSubtitle")}
                </p>

                <AdminRidesFilters
                    statusFilter={statusFilter}
                    onStatusFilterChange={setStatusFilter}
                    searchInput={searchInput}
                    onSearchInputChange={setSearchInput}
                />

                {list.isInitialLoading && (
                    <p className="text-(--color-text-secondary) py-4">
                        {t("admin.loadingRides")}
                    </p>
                )}

                {!list.isInitialLoading && list.isError && (
                    <p className="text-(--color-danger-text) py-4">
                        {t(getErrorI18nKey(list.error, adminRidesErrorMap))}
                    </p>
                )}

                {!list.isInitialLoading &&
                    !list.isError &&
                    list.items.length === 0 && (
                        <p className="text-(--color-text-secondary) py-4">
                            {t("admin.noRidesFound")}
                        </p>
                    )}

                {!list.isInitialLoading &&
                    !list.isError &&
                    list.items.length > 0 && (
                        <>
                            <AdminRidesTable
                                items={list.items}
                                rowMutatingId={rowMutatingId}
                                onView={(r) => openDetail(r.id)}
                                onCancel={(r) => openCancel(r)}
                            />

                            {list.nextCursor && (
                                <div className="flex justify-center mt-6">
                                    <Button
                                        variant="secondary"
                                        onClick={list.loadMore}
                                        disabled={list.isFetching}
                                    >
                                        {t("admin.loadMore")}
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
            </div>

            {selectedRideId && (
                <RideDetailModal
                    key={selectedRideId}
                    theme={theme}
                    rideId={selectedRideId}
                    isThisRideMutating={detailIsMutating}
                    mutationErrorForThisRide={detailErrorForRide}
                    onClose={() => openDetail(null)}
                    onRequestCancel={() => {
                        const target = list.items.find(
                            (r) => r.id === selectedRideId
                        );
                        if (target) {
                            setSelectedRideId(null);
                            openCancel(target);
                        }
                    }}
                />
            )}

            {cancelTarget && (
                <CancelRideModal
                    key={cancelTarget.id}
                    theme={theme}
                    rideRoute={`${cancelTarget.originCity} → ${cancelTarget.destinationCity}`}
                    isPending={rowMutatingId === cancelTarget.id}
                    error={cancelErrorForTarget}
                    onClose={() => openCancel(null)}
                    onConfirm={handleConfirmCancel}
                />
            )}
        </div>
    );
}
