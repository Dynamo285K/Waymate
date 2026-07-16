import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Avatar } from "@/components/ui/Avatar";
import { ConversationActionsDropdown } from "./ConversationActionsDropdown";
import { ChevronDownIcon } from "@/components/ui/icons/ChevronDownIcon";

export type ChatHeaderLabels = {
    viewProfile?: string;
    blockUser?: string;
    reportUser?: string;
};

export type ChatHeaderProps = {
    name: string;
    avatarSrc?: string;
    onViewProfileClick?: () => void;
    onBlockUserClick?: () => void;
    onReportUserClick?: () => void;
    labels?: ChatHeaderLabels;
};

export function ChatHeader({
    name,
    avatarSrc,
    onViewProfileClick,
    onBlockUserClick,
    onReportUserClick,
    labels,
}: ChatHeaderProps) {
    return (
        <header className="w-full min-h-16 py-2.5 px-6 flex items-center justify-between border-b border-border bg-card box-border">
            <div className="flex items-center gap-4">
                <Avatar
                    name={name}
                    src={avatarSrc}
                    size="md"
                />
                <h2 className="m-0 text-base leading-6 font-semibold text-text-primary">
                    {name}
                </h2>
            </div>

            <DropdownMenu.Root>
                <DropdownMenu.Trigger
                    className="w-10 h-10 border border-border rounded-full bg-card text-text-secondary inline-flex items-center justify-center cursor-pointer transition-[background,color] duration-200 hover:bg-background hover:text-text-primary [&_svg]:w-[18px] [&_svg]:h-[18px]"
                    aria-label="Open conversation menu"
                >
                    <ChevronDownIcon />
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                    <DropdownMenu.Content
                        className="z-200"
                        sideOffset={8}
                        align="end"
                    >
                        <ConversationActionsDropdown
                            onViewProfileClick={onViewProfileClick}
                            onBlockUserClick={onBlockUserClick}
                            onReportUserClick={onReportUserClick}
                            labels={labels}
                        />
                    </DropdownMenu.Content>
                </DropdownMenu.Portal>
            </DropdownMenu.Root>
        </header>
    );
}
