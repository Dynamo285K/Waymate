import { useTranslation } from "react-i18next";

type AdminUsersFiltersProps = {
    searchInput: string;
    onSearchInputChange: (value: string) => void;
};

export function AdminUsersFilters({
    searchInput,
    onSearchInputChange,
}: AdminUsersFiltersProps) {
    const { t } = useTranslation();

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
        </div>
    );
}
