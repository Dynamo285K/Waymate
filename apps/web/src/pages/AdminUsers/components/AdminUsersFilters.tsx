import { useTranslation } from "react-i18next";
import * as Select from "@radix-ui/react-select";
import { ChevronDownIcon } from "@waymate/ui";
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

    const options: { value: RoleFilter; label: string }[] = [
        { value: "ALL", label: t("admin.all") },
        { value: "USER", label: t("admin.userRoleUser") },
        { value: "ADMIN", label: t("admin.userRoleAdmin") },
    ];

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
                <Select.Root
                    value={roleFilter}
                    onValueChange={(val) =>
                        onRoleFilterChange(val as RoleFilter)
                    }
                >
                    <Select.Trigger className="flex items-center gap-2 border border-(--color-border) rounded-lg bg-(--color-card) text-(--color-text-primary) text-sm px-3 py-2 outline-none cursor-pointer hover:border-(--color-primary) transition-colors">
                        <Select.Value />
                        <Select.Icon className="text-(--color-text-secondary)">
                            <ChevronDownIcon />
                        </Select.Icon>
                    </Select.Trigger>
                    <Select.Portal>
                        <Select.Content
                            className="z-1100 w-(--radix-select-trigger-width) rounded-xl border border-(--color-border) bg-(--color-card) p-1 shadow-lg"
                            position="popper"
                            sideOffset={4}
                        >
                            <Select.Viewport>
                                {options.map((opt) => (
                                    <Select.Item
                                        key={opt.value}
                                        value={opt.value}
                                        className="flex items-center px-3 py-2 text-sm rounded-lg text-(--color-text-primary) cursor-pointer outline-none data-highlighted:bg-(--color-bg) data-[state=checked]:text-(--color-primary)"
                                    >
                                        <Select.ItemText>
                                            {opt.label}
                                        </Select.ItemText>
                                    </Select.Item>
                                ))}
                            </Select.Viewport>
                        </Select.Content>
                    </Select.Portal>
                </Select.Root>
            </div>
        </div>
    );
}
