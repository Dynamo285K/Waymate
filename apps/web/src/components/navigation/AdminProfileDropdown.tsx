import { LogOutIcon } from "@/components/ui/icons/LogOutIcon";

export type AdminProfileDropdownLabels = {
    logout?: string;
};

export type AdminProfileDropdownProps = {
    name: string;
    email: string;
    onLogoutClick?: () => void;
    labels?: AdminProfileDropdownLabels;
};

const itemBase =
    "w-full min-h-13 px-4.5 border-0 border-t border-border bg-transparent text-text-secondary cursor-pointer text-left transition-[background,color] duration-200 flex items-center gap-3 hover:bg-background hover:text-text-primary first:border-t-0";

function Item({
    icon,
    label,
    onClick,
    danger = false,
}: {
    icon: React.ReactNode;
    label: string;
    onClick?: () => void;
    danger?: boolean;
}) {
    return (
        <button
            type="button"
            className={`${itemBase} ${danger ? "hover:text-red" : ""}`}
            onClick={onClick}
        >
            <span className="inline-flex items-center text-inherit [&_svg]:w-5 [&_svg]:h-5">
                {icon}
            </span>
            <span className="text-control font-medium leading-[22px]">
                {label}
            </span>
        </button>
    );
}

export function AdminProfileDropdown({
    name,
    email,
    onLogoutClick,
    labels,
}: AdminProfileDropdownProps) {
    return (
        <div className="bg-card border border-border rounded-[18px] w-70 overflow-hidden shadow-menu">
            <div className="pt-4.5 pb-3.5 px-5 border-b border-border">
                <p className="m-0 text-base font-bold leading-6 text-text-primary">
                    {name}
                </p>
                <p className="mt-1 m-0 text-sm leading-5 text-text-secondary">
                    {email}
                </p>
            </div>
            <div className="flex flex-col">
                <Item
                    icon={<LogOutIcon />}
                    label={labels?.logout ?? "Logout"}
                    onClick={onLogoutClick}
                    danger
                />
            </div>
        </div>
    );
}
