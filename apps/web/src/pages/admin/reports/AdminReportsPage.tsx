import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@waymate/ui";
import type { Language } from "../../../components/controls/LanguageSwitcher";
import { AdminNavbar } from "../../../components/navigation/AdminNavbar";
import { useAdminNavbarProps } from "../hooks/useAdminNavbarProps";
import { useSetReportStatus } from "./hooks/useSetReportStatus";
import { getGetAdminReportsQueryKey } from "../../../api-client/admin/admin";
import type { ReportStatus } from "../../../api-client/model/reportStatus";
import type { ReportType } from "../../../api-client/model/reportType";
import { getErrorCode, getErrorI18nKey } from "../../../lib/api-errors";
import { AdminReportsFilters } from "./components/AdminReportsFilters";
import { AdminReportsTable } from "./components/AdminReportsTable";
import { ReportDetailModal } from "./components/ReportDetailModal";
import { SetReportStatusModal } from "./components/SetReportStatusModal";
import { useAdminReportsList } from "./hooks/useAdminReportsList";
import { useDebounced } from "../../../hooks/useDebounced";
import {
    ADMIN_REPORT_NOT_FOUND_CODE,
    adminReportsErrorMap,
} from "./lib/admin-report-errors";

type AdminReportsPageProps = {
    language: Language;
    theme: "light" | "dark";
    onLanguageChange: (lang: Language) => void;
    onThemeToggle: () => void;
    userName?: string;
    userEmail?: string;
};

type StatusFilter = "ALL" | ReportStatus;
type TypeFilter = "ALL" | ReportType;

const SEARCH_DEBOUNCE_MS = 300;

export function AdminReportsPage({
    language,
    theme,
    onLanguageChange,
    onThemeToggle,
    userName,
    userEmail,
}: AdminReportsPageProps) {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
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

    const setReportStatus = useSetReportStatus();

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

    const openDetail = (id: string | null) => {
        setReportStatus.reset();
        setPendingStatus(null);
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
