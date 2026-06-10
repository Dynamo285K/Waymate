import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@waymate/ui";
import type { Language } from "../../components/controls/LanguageSwitcher";
import { AdminNavbar } from "../../components/navigation/AdminNavbar";
import { useAdminNavbarProps } from "../../features/admin/hooks/useAdminNavbarProps";
import { useSetUserStatus } from "./-users/hooks/useSetUserStatus";
import { getGetAdminUsersQueryKey } from "../../api-client/admin/admin";
import type { AdminUserListItem } from "../../api-client/model/adminUserListItem";
import { getErrorCode, getErrorI18nKey } from "../../lib/api-errors";
import { AdminUsersFilters } from "./-users/components/AdminUsersFilters";
import { AdminUsersTable } from "./-users/components/AdminUsersTable";
import { BanUserModal } from "./-users/components/BanUserModal";
import { UserDetailModal } from "./-users/components/UserDetailModal";
import { useAdminUsersList } from "./-users/hooks/useAdminUsersList";
import { useDebounced } from "../../hooks/shared/useDebounced";
import {
    ADMIN_USER_NOT_FOUND_CODE,
    adminUsersErrorMap,
} from "./-users/lib/admin-errors";
import { fullName } from "../../features/admin/lib/admin-format";
import { requireAudience } from "../../lib/route-guards";
import { makeAudienceComponent } from "../../lib/make-audience-component";

export const Route = createFileRoute("/admin/users")({
    beforeLoad: requireAudience(["admin"]),
    component: makeAudienceComponent(AdminUsersPage),
});

type AdminUsersPageProps = {
    language: Language;
    theme: "light" | "dark";
    onLanguageChange: (lang: Language) => void;
    onThemeToggle: () => void;
    userId?: string;
    userName?: string;
    userEmail?: string;
};

const SEARCH_DEBOUNCE_MS = 300;

export function AdminUsersPage({
    language,
    theme,
    onLanguageChange,
    onThemeToggle,
    userId,
    userName,
    userEmail,
}: AdminUsersPageProps) {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const navbarProps = useAdminNavbarProps({
        activeTab: "users",
        language,
        onLanguageChange,
        theme,
        onThemeToggle,
        userName,
        userEmail,
    });

    const [searchInput, setSearchInput] = useState("");
    const debouncedSearch = useDebounced(searchInput, SEARCH_DEBOUNCE_MS);

    const trimmedSearch = debouncedSearch.trim();
    const list = useAdminUsersList({
        search: trimmedSearch.length > 0 ? trimmedSearch : undefined,
    });

    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [banTarget, setBanTarget] = useState<AdminUserListItem | null>(null);

    const setUserStatus = useSetUserStatus();

    // The mutation hook exposes `variables` from the underlying mutation,
    // which is the toVars-mapped shape `{ id, data: { ... } }`.
    const statusMutatingId = setUserStatus.isPending
        ? (setUserStatus.variables?.id ?? null)
        : null;

    const errorTargetForStatus = setUserStatus.isError
        ? (setUserStatus.variables?.id ?? null)
        : null;

    const detailErrorForUser =
        selectedUserId && errorTargetForStatus === selectedUserId
            ? setUserStatus.error
            : null;
    const banErrorForTarget =
        banTarget && errorTargetForStatus === banTarget.id
            ? setUserStatus.error
            : null;

    const detailIsMutating =
        selectedUserId !== null && statusMutatingId === selectedUserId;

    const handleMutationFailure = useCallback(
        (error: unknown) => {
            if (getErrorCode(error) === ADMIN_USER_NOT_FOUND_CODE) {
                void queryClient.invalidateQueries({
                    queryKey: getGetAdminUsersQueryKey(),
                });
                setSelectedUserId(null);
                setBanTarget(null);
            }
        },
        [queryClient]
    );

    const handleConfirmBan = (reason: string | undefined) => {
        if (!banTarget) return;
        setUserStatus.mutate(
            { userId: banTarget.id, status: "BANNED", reason },
            {
                onSuccess: () => setBanTarget(null),
                onError: handleMutationFailure,
            }
        );
    };

    const handleUnban = (target: AdminUserListItem) => {
        setUserStatus.mutate(
            { userId: target.id, status: "ACTIVE" },
            { onError: handleMutationFailure }
        );
    };

    // Centralized open/close so any prior mutation state from a different
    // target is cleared before the modal sees a fresh row. The `key` prop on
    // each modal also blows away its local UI state on target switch, so no
    // useEffect-on-prop-change is needed inside the modals.
    const openDetail = (id: string | null) => {
        setUserStatus.reset();
        setSelectedUserId(id);
    };

    const openBan = (target: AdminUserListItem | null) => {
        setUserStatus.reset();
        setBanTarget(target);
    };

    return (
        <div
            data-theme={theme}
            className="min-h-screen bg-(--color-bg)"
        >
            <AdminNavbar {...navbarProps} />

            <div className="w-full px-4 sm:max-w-6xl sm:mx-auto sm:px-8 py-8">
                <h1 className="text-2xl font-bold text-(--color-text-primary)">
                    {t("admin.usersTitle")}
                </h1>
                <p className="text-(--color-text-secondary) text-sm mt-1 mb-6">
                    {t("admin.usersSubtitle")}
                </p>

                <AdminUsersFilters
                    searchInput={searchInput}
                    onSearchInputChange={setSearchInput}
                />

                {list.isInitialLoading && (
                    <p className="text-(--color-text-secondary) py-4">
                        {t("admin.loadingUsers")}
                    </p>
                )}

                {!list.isInitialLoading && list.isError && (
                    <p className="text-(--color-danger-text) py-4">
                        {t(getErrorI18nKey(list.error, adminUsersErrorMap))}
                    </p>
                )}

                {!list.isInitialLoading &&
                    !list.isError &&
                    list.items.length === 0 && (
                        <p className="text-(--color-text-secondary) py-4">
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
                                rowMutatingId={statusMutatingId}
                                onView={(u) => openDetail(u.id)}
                                onBan={(u) => openBan(u)}
                                onUnban={handleUnban}
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

            {selectedUserId && (
                <UserDetailModal
                    key={selectedUserId}
                    theme={theme}
                    userId={selectedUserId}
                    isSelf={selectedUserId === userId}
                    isThisUserMutating={detailIsMutating}
                    mutationErrorForThisUser={detailErrorForUser}
                    onClose={() => openDetail(null)}
                    onRequestBan={() => {
                        const target = list.items.find(
                            (u) => u.id === selectedUserId
                        );
                        if (target) {
                            setSelectedUserId(null);
                            openBan(target);
                        }
                    }}
                    onUnban={() => {
                        const target = list.items.find(
                            (u) => u.id === selectedUserId
                        );
                        if (target) handleUnban(target);
                    }}
                />
            )}

            {banTarget && (
                <BanUserModal
                    key={banTarget.id}
                    theme={theme}
                    userName={
                        fullName(banTarget.firstName, banTarget.lastName) ||
                        banTarget.email
                    }
                    isPending={statusMutatingId === banTarget.id}
                    error={banErrorForTarget}
                    onClose={() => openBan(null)}
                    onConfirm={handleConfirmBan}
                />
            )}
        </div>
    );
}
