import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@waymate/ui";
import { AdminNavbar } from "../../components/navigation/AdminNavbar";
import { useAdminNavbarProps } from "../../features/admin/hooks/useAdminNavbarProps";
import { useSetReportStatus } from "./-reports/hooks/useSetReportStatus";
import { useSetUserStatus } from "./-users/hooks/useSetUserStatus";
import { BanUserModal } from "./-users/components/BanUserModal";
import {
    getGetAdminReportsQueryKey,
    getGetAdminReportsByIdQueryKey,
} from "../../api-client/admin/admin";
import type { ReportStatus } from "../../api-client/model/reportStatus";
import type { ReportType } from "../../api-client/model/reportType";
import { getErrorCode, getErrorI18nKey } from "../../lib/api-errors";
import { AdminReportsFilters } from "./-reports/components/AdminReportsFilters";
import { AdminReportsTable } from "./-reports/components/AdminReportsTable";
import { ReportDetailModal } from "./-reports/components/ReportDetailModal";
import { SetReportStatusModal } from "./-reports/components/SetReportStatusModal";
import { useAdminReportsList } from "./-reports/hooks/useAdminReportsList";
import { useDebounced } from "../../hooks/shared/useDebounced";
import {
    ADMIN_REPORT_NOT_FOUND_CODE,
    adminReportsErrorMap,
} from "./-reports/lib/admin-report-errors";
import { authClient } from "../../lib/auth-client";
import { getDisplayName } from "../../lib/session-user";
import { requireAudience } from "../../lib/route-guards";
import { useLayout } from "../../lib/use-layout";

export const Route = createFileRoute("/admin/reports")({
    beforeLoad: requireAudience(["admin"]),
    component: AdminReportsPage,
});

type StatusFilter = "ALL" | ReportStatus;
type TypeFilter = "ALL" | ReportType;

const SEARCH_DEBOUNCE_MS = 300;

function AdminReportsPage() {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const { language, theme, onLanguageChange, onThemeToggle } = useLayout();
    const { data: session } = authClient.useSession();
    const user = session?.user;
    const userName = user ? getDisplayName(user) : undefined;
    const userEmail = user?.email;
    const navbarProps = useAdminNavbarProps({
        activeTab: "reports",
        language,
        onLanguageChange,
        theme,
        onThemeToggle,
        userName,
        userEmail,
    });

    const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
    const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");
    const [searchInput, setSearchInput] = useState("");
    const debouncedSearch = useDebounced(searchInput, SEARCH_DEBOUNCE_MS);

    const trimmedSearch = debouncedSearch.trim();
    const list = useAdminReportsList({
        status: statusFilter === "ALL" ? undefined : statusFilter,
        reportType: typeFilter === "ALL" ? undefined : typeFilter,
        search: trimmedSearch.length > 0 ? trimmedSearch : undefined,
    });

    const [selectedReportId, setSelectedReportId] = useState<string | null>(
        null
    );
    const [pendingStatus, setPendingStatus] = useState<ReportStatus | null>(
        null
    );
    const [banTarget, setBanTarget] = useState<{
        id: string;
        name: string;
    } | null>(null);

    const setReportStatus = useSetReportStatus();
    const setUserStatus = useSetUserStatus();

    const rowMutatingId = setReportStatus.isPending
        ? (setReportStatus.variables?.id ?? null)
        : null;

    const errorTargetForStatus = setReportStatus.isError
        ? (setReportStatus.variables?.id ?? null)
        : null;

    const detailErrorForReport =
        selectedReportId && errorTargetForStatus === selectedReportId
            ? setReportStatus.error
            : null;
    const modalError =
        selectedReportId && errorTargetForStatus === selectedReportId
            ? setReportStatus.error
            : null;

    const detailIsMutating =
        selectedReportId !== null && rowMutatingId === selectedReportId;

    const handleMutationFailure = useCallback(
        (error: unknown) => {
            if (getErrorCode(error) === ADMIN_REPORT_NOT_FOUND_CODE) {
                void queryClient.invalidateQueries({
                    queryKey: getGetAdminReportsQueryKey(),
                });
                setSelectedReportId(null);
                setPendingStatus(null);
            }
        },
        [queryClient]
    );

    const handleConfirm = (reason: string | undefined) => {
        if (!selectedReportId || !pendingStatus) return;
        setReportStatus.mutate(
            {
                reportId: selectedReportId,
                status: pendingStatus,
                reason,
            },
            {
                onSuccess: () => setPendingStatus(null),
                onError: handleMutationFailure,
            }
        );
    };

    const handleConfirmBan = (reason: string | undefined) => {
        if (!banTarget) return;
        const reportId = selectedReportId;
        setUserStatus.mutate(
            { userId: banTarget.id, status: "BANNED", reason },
            {
                onSuccess: () => {
                    setBanTarget(null);
                    // Refresh the detail so the target shows as banned and the
                    // ban button is replaced by the "already banned" note.
                    if (reportId) {
                        void queryClient.invalidateQueries({
                            queryKey: getGetAdminReportsByIdQueryKey(reportId),
                        });
                    }
                },
            }
        );
    };

    const openDetail = (id: string | null) => {
        setReportStatus.reset();
        setUserStatus.reset();
        setPendingStatus(null);
        setBanTarget(null);
        setSelectedReportId(id);
    };

    return (
        <div
            data-theme={theme}
            className="min-h-screen bg-(--color-bg)"
        >
            <AdminNavbar {...navbarProps} />

            <div className="w-full px-4 sm:max-w-6xl sm:mx-auto sm:px-8 py-8">
                <h1 className="text-2xl font-bold text-(--color-text-primary)">
                    {t("admin.reports.title")}
                </h1>
                <p className="text-(--color-text-secondary) text-sm mt-1 mb-6">
                    {t("admin.reports.subtitle")}
                </p>

                <AdminReportsFilters
                    statusFilter={statusFilter}
                    onStatusFilterChange={setStatusFilter}
                    typeFilter={typeFilter}
                    onTypeFilterChange={setTypeFilter}
                    searchInput={searchInput}
                    onSearchInputChange={setSearchInput}
                />

                {list.isInitialLoading && (
                    <p className="text-(--color-text-secondary) py-4">
                        {t("admin.reports.loading")}
                    </p>
                )}

                {!list.isInitialLoading && list.isError && (
                    <p className="text-(--color-danger-text) py-4">
                        {t(getErrorI18nKey(list.error, adminReportsErrorMap))}
                    </p>
                )}

                {!list.isInitialLoading &&
                    !list.isError &&
                    list.items.length === 0 && (
                        <p className="text-(--color-text-secondary) py-4">
                            {t("admin.reports.empty")}
                        </p>
                    )}

                {!list.isInitialLoading &&
                    !list.isError &&
                    list.items.length > 0 && (
                        <>
                            <AdminReportsTable
                                items={list.items}
                                rowMutatingId={rowMutatingId}
                                onView={(r) => openDetail(r.id)}
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

            {selectedReportId && (
                <ReportDetailModal
                    key={selectedReportId}
                    theme={theme}
                    reportId={selectedReportId}
                    isThisReportMutating={detailIsMutating}
                    mutationErrorForThisReport={detailErrorForReport}
                    onClose={() => openDetail(null)}
                    onRequestStatus={(target) => setPendingStatus(target)}
                    onBanTarget={(target) => {
                        setUserStatus.reset();
                        setBanTarget(target);
                    }}
                />
            )}

            {banTarget && (
                <BanUserModal
                    theme={theme}
                    userName={banTarget.name}
                    isPending={setUserStatus.isPending}
                    error={setUserStatus.isError ? setUserStatus.error : null}
                    onClose={() => setBanTarget(null)}
                    onConfirm={handleConfirmBan}
                />
            )}

            {selectedReportId && pendingStatus && (
                <SetReportStatusModal
                    key={`${selectedReportId}-${pendingStatus}`}
                    theme={theme}
                    targetStatus={pendingStatus}
                    isPending={rowMutatingId === selectedReportId}
                    error={modalError}
                    onClose={() => setPendingStatus(null)}
                    onConfirm={handleConfirm}
                />
            )}
        </div>
    );
}
