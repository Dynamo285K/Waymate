import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Avatar } from "@/components/ui/Avatar";
import { ChevronDownIcon } from "@/components/ui/icons/ChevronDownIcon";

type ChatThreadHeaderProps = {
    name: string;
    // Ride tag of this thread ("Driver · Náchod → Brno 12. 7."), rendered as a
    // clickable subtitle under the name — threads are ride-scoped, so the
    // header links straight to the ride.
    rideLabel: string | null;
    onRideClick: (() => void) | null;
    rideLinkTitle: string;
    theme: "light" | "dark";
    menuLabel: string;
    onViewProfileClick: () => void;
    onReportUserClick: () => void;
    onBlockUserClick: () => void;
    labels: {
        viewProfile: string;
        blockUser: string;
        reportUser: string;
    };
};

const menuItemClass =
    "cursor-pointer px-3.5 py-2 text-sm text-text-primary outline-none data-highlighted:bg-border";

// Local replacement for @waymate/ui's ChatHeader: same avatar + name + a
// chevron-triggered actions menu, plus a subtitle slot the packaged component
// doesn't have. (The kit's ConversationActionsDropdown renders its items
// permanently expanded, so the collapsible menu is built here with Radix —
// same pattern as the message actions menu in ChatThread.)
export function ChatThreadHeader({
    name,
    rideLabel,
    onRideClick,
    rideLinkTitle,
    theme,
    menuLabel,
    onViewProfileClick,
    onReportUserClick,
    onBlockUserClick,
    labels,
}: ChatThreadHeaderProps) {
    // Deferred a tick so the menu finishes closing (and returning focus)
    // before a modal's focus trap takes over — two live focus scopes fight
    // (same workaround as the message actions menu in ChatThread).
    const deferred = (action: () => void) => () => setTimeout(action, 0);
    return (
        <div className="flex w-full items-center gap-3">
            <Avatar
                name={name}
                size="sm"
            />
            <div className="min-w-0 flex-1">
                <div className="truncate font-semibold text-text-primary">
                    {name}
                </div>
                {rideLabel && onRideClick && (
                    <button
                        type="button"
                        onClick={onRideClick}
                        title={rideLinkTitle}
                        className="block max-w-full cursor-pointer truncate border-0 bg-transparent p-0 text-left text-xs text-text-secondary transition-colors hover:text-primary hover:underline"
                    >
                        {rideLabel}
                        <span aria-hidden="true"> →</span>
                    </button>
                )}
            </div>
            <DropdownMenu.Root>
                <DropdownMenu.Trigger
                    aria-label={menuLabel}
                    className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-card text-text-secondary shadow-button hover:bg-border icon-svg:h-4 icon-svg:w-4"
                >
                    <ChevronDownIcon />
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                    <DropdownMenu.Content
                        className="z-200 min-w-44 overflow-hidden rounded-summary-card border border-border bg-card py-1 shadow-dropdown-strong"
                        sideOffset={6}
                        align="end"
                        data-theme={theme}
                    >
                        <DropdownMenu.Item
                            className={menuItemClass}
                            onSelect={deferred(onViewProfileClick)}
                        >
                            {labels.viewProfile}
                        </DropdownMenu.Item>
                        <DropdownMenu.Item
                            className={menuItemClass}
                            onSelect={deferred(onBlockUserClick)}
                        >
                            {labels.blockUser}
                        </DropdownMenu.Item>
                        <DropdownMenu.Item
                            className={menuItemClass}
                            onSelect={deferred(onReportUserClick)}
                        >
                            {labels.reportUser}
                        </DropdownMenu.Item>
                    </DropdownMenu.Content>
                </DropdownMenu.Portal>
            </DropdownMenu.Root>
        </div>
    );
}
