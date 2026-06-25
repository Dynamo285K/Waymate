import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@waymate/ui";
import { useAdminCancelRide } from "./-hooks/useAdminCancelRide";
import { getGetRidesAdminQueryKey } from "../../../api-client/rides/rides";
import type { AdminRideListItem } from "../../../api-client/model/adminRideListItem";
import { getErrorCode, getErrorI18nKey } from "../../../lib/api-errors";
import { AdminRidesFilters } from "./-components/AdminRidesFilters";
import { AdminRidesTable } from "./-components/AdminRidesTable";
import { CancelRideModal } from "./-components/CancelRideModal";
import { RideDetailModal } from "./-components/RideDetailModal";
import { useAdminRidesList } from "./-hooks/useAdminRidesList";
import { useRidesFilters } from "./-hooks/useRidesFilters";
import {
    ADMIN_RIDE_NOT_FOUND_CODE,
    adminRidesErrorMap,
} from "./-lib/admin-ride-errors";
import { useLayout } from "../../../lib/use-layout";

export const Route = createFileRoute("/admin/rides/")({
    component: AdminRidesPage,
});

function AdminRidesPage() {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const { theme } = useLayout();

    const filters = useRidesFilters();
    const list = useAdminRidesList(filters.queryParams);

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
                    queryKey: getGetRidesAdminQueryKey(),
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
            className="min-h-screen bg-background"
        >
            <div className="w-full px-4 sm:max-w-6xl sm:mx-auto sm:px-8 py-8">
                <h1 className="text-2xl font-bold text-text-primary">
                    {t("admin.ridesTitle")}
                </h1>
                <p className="text-text-secondary text-sm mt-1 mb-6">
                    {t("admin.ridesSubtitle")}
                </p>

                <AdminRidesFilters {...filters.controls} />

                {list.isInitialLoading && (
                    <p className="text-text-secondary py-4">
                        {t("admin.loadingRides")}
                    </p>
                )}

                {!list.isInitialLoading && list.isError && (
                    <p className="text-danger-text py-4">
                        {t(getErrorI18nKey(list.error, adminRidesErrorMap))}
                    </p>
                )}

                {!list.isInitialLoading &&
                    !list.isError &&
                    list.items.length === 0 && (
                        <p className="text-text-secondary py-4">
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
