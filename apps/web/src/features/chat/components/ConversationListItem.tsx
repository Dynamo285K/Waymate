import { Avatar } from "@/components/ui/Avatar";

export type ConversationListItemProps = {
    name: string;
    lastMessage: string;
    active?: boolean;
    onClick?: () => void;
};

export function ConversationListItem({
    name,
    lastMessage,
    active = false,
    onClick,
}: ConversationListItemProps) {
    return (
        <button
            className={`w-full flex items-center gap-3 py-3 px-4 border-0 bg-transparent cursor-pointer text-left transition-[background] duration-200 hover:bg-background ${
                active ? "bg-border" : ""
            }`}
            onClick={onClick}
        >
            <Avatar
                name={name}
                size="md"
            />

            <div className="flex flex-col gap-0.5 min-w-0">
                <p className="m-0 text-sm font-semibold text-text-primary">
                    {name}
                </p>
                <p className="m-0 text-caption text-text-secondary whitespace-nowrap overflow-hidden text-ellipsis">
                    {lastMessage}
                </p>
            </div>
        </button>
    );
}
