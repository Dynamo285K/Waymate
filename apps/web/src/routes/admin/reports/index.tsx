import { useTranslation } from "react-i18next";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@waymate/ui";
import { BanUserModal } from "../users/-components/BanUserModal";
import { getErrorI18nKey } from "../../../lib/api-errors";
import { AdminReportsFilters } from "./-components/AdminReportsFilters";
import { AdminReportsTable } from "./-components/AdminReportsTable";
import { ReportDetailModal } from "./-components/ReportDetailModal";
import { SetReportStatusModal } from "./-components/SetReportStatusModal";
import { useAdminReportsList } from "./-hooks/useAdminReportsList";
import { useReportsFilters } from "./-hooks/useReportsFilters";
import { useAdminReportsActions } from "./-hooks/useAdminReportsActions";
import { adminReportsErrorMap } from "./-lib/admin-report-errors";
import { useLayout } from "../../../lib/use-layout";

export const Route = createFileRoute("/admin/reports/")({
    component: AdminReportsPage,
});

function AdminReportsPage() {
    const { t } = useTranslation();
    const { theme } = useLayout();

    const filters = useReportsFilters();
    const list = useAdminReportsList(filters.queryParams);
    const actions = useAdminReportsActions();

    return (
        <div
            data-theme={theme}
            className="min-h-screen bg-background"
        >
            <div className="w-full px-4 sm:max-w-6xl sm:mx-auto sm:px-8 py-8">
                <h1 className="text-2xl font-bold text-text-primary">
                    {t("admin.reports.title")}
                </h1>
                <p className="text-text-secondary text-sm mt-1 mb-6">
                    {t("admin.reports.subtitle")}
                </p>

                <AdminReportsFilters {...filters.controls} />

                {list.isInitialLoading && (
                    <p className="text-text-secondary py-4">
                        {t("admin.reports.loading")}
                    </p>
                )}

                {!list.isInitialLoading && list.isError && (
                    <p className="text-danger-text py-4">
                        {t(getErrorI18nKey(list.error, adminReportsErrorMap))}
                    </p>
                )}

                {!list.isInitialLoading &&
                    !list.isError &&
                    list.items.length === 0 && (
                        <p className="text-text-secondary py-4">
                            {t("admin.reports.empty")}
                        </p>
                    )}

                {!list.isInitialLoading &&
                    !list.isError &&
                    list.items.length > 0 && (
                        <>
                            <AdminReportsTable
                                items={list.items}
                                rowMutatingId={actions.rowMutatingId}
                                onView={(r) => actions.openDetail(r.id)}
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

            {actions.selectedReportId && (
                <ReportDetailModal
                    key={actions.selectedReportId}
                    theme={theme}
                    reportId={actions.selectedReportId}
                    isThisReportMutating={actions.detailIsMutating}
                    mutationErrorForThisReport={actions.detailError}
                    onClose={() => actions.openDetail(null)}
                    onRequestStatus={actions.requestStatus}
                    onBanTarget={actions.requestBan}
                />
            )}

            {actions.banTarget && (
                <BanUserModal
                    theme={theme}
                    userName={actions.banTarget.name}
                    isPending={actions.banModalIsPending}
                    error={actions.banModalError}
                    onClose={actions.closeBanModal}
                    onConfirm={actions.handleConfirmBan}
                />
            )}

            {actions.selectedReportId && actions.pendingStatus && (
                <SetReportStatusModal
                    key={`${actions.selectedReportId}-${actions.pendingStatus}`}
                    theme={theme}
                    targetStatus={actions.pendingStatus}
                    isPending={actions.statusModalIsPending}
                    error={actions.statusModalError}
                    onClose={actions.closeStatusModal}
                    onConfirm={actions.handleConfirmStatus}
                />
            )}
        </div>
    );
}
