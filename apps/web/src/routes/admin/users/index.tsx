import { useTranslation } from "react-i18next";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@waymate/ui";
import { getErrorI18nKey } from "../../../lib/api-errors";
import { AdminUsersFilters } from "./-components/AdminUsersFilters";
import { AdminUsersTable } from "./-components/AdminUsersTable";
import { BanUserModal } from "./-components/BanUserModal";
import { UserDetailModal } from "./-components/UserDetailModal";
import { useAdminUsersList } from "./-hooks/useAdminUsersList";
import { useUsersFilters } from "./-hooks/useUsersFilters";
import { useAdminUsersActions } from "./-hooks/useAdminUsersActions";
import { adminUsersErrorMap } from "./-lib/admin-errors";
import { fullName } from "../../../features/admin/lib/admin-format";
import { useSession } from "../../../lib/use-session";
import { useLayout } from "../../../lib/use-layout";

export const Route = createFileRoute("/admin/users/")({
    component: AdminUsersPage,
});

function AdminUsersPage() {
    const { t } = useTranslation();
    const { theme } = useLayout();
    const { data: session } = useSession();
    const userId = session?.user?.id;

    const filters = useUsersFilters();
    const list = useAdminUsersList(filters.queryParams);
    const actions = useAdminUsersActions(list.items);

    return (
        <div
            data-theme={theme}
            className="min-h-screen bg-background"
        >
            <div className="w-full px-4 sm:max-w-6xl sm:mx-auto sm:px-8 py-8">
                <h1 className="text-2xl font-bold text-text-primary">
                    {t("admin.usersTitle")}
                </h1>
                <p className="text-text-secondary text-sm mt-1 mb-6">
                    {t("admin.usersSubtitle")}
                </p>

                <AdminUsersFilters {...filters.controls} />

                {list.isInitialLoading && (
                    <p className="text-text-secondary py-4">
                        {t("admin.loadingUsers")}
                    </p>
                )}

                {!list.isInitialLoading && list.isError && (
                    <p className="text-danger-text py-4">
                        {t(getErrorI18nKey(list.error, adminUsersErrorMap))}
                    </p>
                )}

                {!list.isInitialLoading &&
                    !list.isError &&
                    list.items.length === 0 && (
                        <p className="text-text-secondary py-4">
                            {t("admin.noUsersFound")}
                        </p>
                    )}

                {!list.isInitialLoading &&
                    !list.isError &&
                    list.items.length > 0 && (
                        <>
                            <AdminUsersTable
                                items={list.items}
                                currentUserId={userId}
                                rowMutatingId={actions.statusMutatingId}
                                onView={(u) => actions.openDetail(u.id)}
                                onBan={(u) => actions.openBan(u)}
                                onUnban={actions.handleUnban}
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

            {actions.selectedUserId && (
                <UserDetailModal
                    key={actions.selectedUserId}
                    theme={theme}
                    userId={actions.selectedUserId}
                    isSelf={actions.selectedUserId === userId}
                    isThisUserMutating={actions.detailIsMutating}
                    mutationErrorForThisUser={actions.detailErrorForUser}
                    onClose={() => actions.openDetail(null)}
                    onRequestBan={actions.banSelectedUser}
                    onUnban={actions.unbanSelectedUser}
                />
            )}

            {actions.banTarget && (
                <BanUserModal
                    key={actions.banTarget.id}
                    theme={theme}
                    userName={
                        fullName(
                            actions.banTarget.firstName,
                            actions.banTarget.lastName
                        ) || actions.banTarget.email
                    }
                    isPending={actions.banModalIsPending}
                    error={actions.banErrorForTarget}
                    onClose={actions.closeBanModal}
                    onConfirm={actions.handleConfirmBan}
                />
            )}
        </div>
    );
}
