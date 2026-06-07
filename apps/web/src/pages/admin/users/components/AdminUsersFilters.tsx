import { useTranslation } from "react-i18next";
import { SearchInput } from "@waymate/ui";

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
            <div className="w-full sm:max-w-sm">
                <SearchInput
                    placeholder={t("admin.searchUsers")}
                    value={searchInput}
                    onChange={onSearchInputChange}
                />
            </div>
        </div>
    );
}
