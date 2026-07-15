import type { ReactNode } from "react";
import { UserIcon } from "@/components/ui/icons/UserIcon";
import { ListIcon } from "@/components/ui/icons/ListIcon";
import { MessageCircleIcon } from "@/components/ui/icons/MessageCircleIcon";
import { StarIcon } from "@/components/ui/icons/StarIcon";
import { LogOutIcon } from "@/components/ui/icons/LogOutIcon";

type ProfileDropdownItemProps = {
    icon: ReactNode;
    label: string;
    onClick?: () => void;
    danger?: boolean;
};

const itemBase =
    "w-full min-h-14 px-4.5 border-0 border-t border-border bg-transparent text-text-secondary cursor-pointer text-left transition-[background,color] duration-200 flex items-center gap-3 hover:bg-background hover:text-text-primary first:border-t-0";

function ProfileDropdownItem({
    icon,
    label,
    onClick,
    danger = false,
}: ProfileDropdownItemProps) {
    return (
        <button
            type="button"
            className={`${itemBase} ${danger ? "hover:text-red" : ""}`}
            onClick={onClick}
        >
            <span className="inline-flex items-center justify-center text-inherit [&_svg]:w-5 [&_svg]:h-5">
                {icon}
            </span>
            <span className="text-control leading-[22px] font-medium">
                {label}
            </span>
        </button>
    );
}

export type ProfileDropdownLabels = {
    profile?: string;
    myRides?: string;
    messages?: string;
    ratings?: string;
    logout?: string;
};

export type ProfileDropdownProps = {
    name: string;
    email: string;
    onProfileClick?: () => void;
    onMyRidesClick?: () => void;
    onMessagesClick?: () => void;
    onRatingsClick?: () => void;
    onLogoutClick?: () => void;
    labels?: ProfileDropdownLabels;
};

export function ProfileDropdown({
    name,
    email,
    onProfileClick,
    onMyRidesClick,
    onMessagesClick,
    onRatingsClick,
    onLogoutClick,
    labels,
}: ProfileDropdownProps) {
    return (
        <div className="w-80 rounded-[18px] overflow-hidden bg-card border border-border shadow-menu">
            <div className="pt-4.5 pb-3.5 px-5 border-b border-border">
                <p className="m-0 text-base leading-6 font-bold text-text-primary">
                    {name}
                </p>
                <p className="mt-1 m-0 text-sm leading-5 text-text-secondary">
                    {email}
                </p>
            </div>

            <div className="flex flex-col">
                <ProfileDropdownItem
                    icon={<UserIcon />}
                    label={labels?.profile ?? "My profile"}
                    onClick={onProfileClick}
                />
                <ProfileDropdownItem
                    icon={<ListIcon />}
                    label={labels?.myRides ?? "My rides"}
                    onClick={onMyRidesClick}
                />
                <ProfileDropdownItem
                    icon={<MessageCircleIcon />}
                    label={labels?.messages ?? "Messages"}
                    onClick={onMessagesClick}
                />
                <ProfileDropdownItem
                    icon={<StarIcon />}
                    label={labels?.ratings ?? "Ratings"}
                    onClick={onRatingsClick}
                />
                <ProfileDropdownItem
                    icon={<LogOutIcon />}
                    label={labels?.logout ?? "Logout"}
                    onClick={onLogoutClick}
                    danger
                />
            </div>
        </div>
    );
}
