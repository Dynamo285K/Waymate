import { ConversationListItem } from "./ConversationListItem";

export type ConversationSidebarItem = {
    id: string;
    name: string;
    lastMessage: string;
};

export type ConversationSidebarProps = {
    title?: string;
    conversations: ConversationSidebarItem[];
    activeConversationId?: string;
    onConversationClick?: (id: string) => void;
};

export function ConversationSidebar({
    title = "Messages",
    conversations,
    activeConversationId,
    onConversationClick,
}: ConversationSidebarProps) {
    return (
        <aside className="w-full max-w-sidebar max-md:max-w-full min-h-full bg-card border-r border-border max-md:border-r-0 flex flex-col">
            <div className="px-6 py-4 border-b border-border">
                <h2 className="m-0 text-2xl leading-8 font-bold text-text-primary">
                    {title}
                </h2>
            </div>

            <div className="flex flex-col">
                {conversations.map((conversation) => (
                    <ConversationListItem
                        key={conversation.id}
                        name={conversation.name}
                        lastMessage={conversation.lastMessage}
                        active={conversation.id === activeConversationId}
                        onClick={() => onConversationClick?.(conversation.id)}
                    />
                ))}
            </div>
        </aside>
    );
}
