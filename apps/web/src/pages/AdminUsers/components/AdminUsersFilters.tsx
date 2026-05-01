import { useTranslation } from "react-i18next";
import type { UserRole } from "../../../api-client/model/userRole";

export type RoleFilter = UserRole | "ALL";

type AdminUsersFiltersProps = {
    searchInput: string;
    onSearchInputChange: (value: string) => void;
    roleFilter: RoleFilter;
    onRoleFilterChange: (value: RoleFilter) => void;
};

export function AdminUsersFilters({
    searchInput,
    onSearchInputChange,
    roleFilter,
    onRoleFilterChange,
}: AdminUsersFiltersProps) {
    const { t } = useTranslation();
    const selectClass =
        "border border-(--color-border) rounded-lg bg-(--color-card) text-(--color-text-primary) text-sm px-3 py-2 outline-none cursor-pointer";

    return (
        <div className="flex flex-col gap-3 mb-6">
            <div className="flex items-center gap-2 border border-(--color-border) rounded-xl px-3 py-2 bg-(--color-card) w-full sm:max-w-sm">
                <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-(--color-text-secondary) shrink-0"
                >
                    <circle
                        cx="11"
                        cy="11"
                        r="8"
                    />
                    <path d="m21 21-4.35-4.35" />
                </svg>
                <input
                    className="bg-transparent border-none outline-none text-sm text-(--color-text-primary) w-full"
                    placeholder={t("admin.searchUsers")}
                    value={searchInput}
                    onChange={(e) => onSearchInputChange(e.target.value)}
                />
            </div>
            <div className="flex gap-3">
                <select
                    className={selectClass}
                    value={roleFilter}
                    onChange={(e) =>
                        onRoleFilterChange(e.target.value as RoleFilter)
                    }
                >
                    <option value="ALL">{t("admin.all")}</option>
                    <option value="USER">{t("admin.userRoleUser")}</option>
                    <option value="ADMIN">{t("admin.userRoleAdmin")}</option>
                </select>
            </div>
        </div>
    );
}
