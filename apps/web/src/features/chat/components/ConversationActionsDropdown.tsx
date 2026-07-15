const itemBase =
    "w-full min-h-12 px-4 border-0 border-t border-border bg-transparent text-text-secondary cursor-pointer text-left transition-[background,color] duration-200 flex items-center hover:bg-background hover:text-text-primary first:border-t-0";

type ConversationActionsDropdownItemProps = {
    label: string;
    onClick?: () => void;
    danger?: boolean;
};

function ConversationActionsDropdownItem({
    label,
    onClick,
    danger = false,
}: ConversationActionsDropdownItemProps) {
    return (
        <button
            type="button"
            className={`${itemBase} ${danger ? "hover:text-red" : ""}`}
            onClick={onClick}
        >
            <span className="text-sm leading-5 font-medium">{label}</span>
        </button>
    );
}

export type ConversationActionsDropdownLabels = {
    viewProfile?: string;
    blockUser?: string;
    reportUser?: string;
};

export type ConversationActionsDropdownProps = {
    onViewProfileClick?: () => void;
    onBlockUserClick?: () => void;
    onReportUserClick?: () => void;
    labels?: ConversationActionsDropdownLabels;
};

export function ConversationActionsDropdown({
    onViewProfileClick,
    onBlockUserClick,
    onReportUserClick,
    labels,
}: ConversationActionsDropdownProps) {
    return (
        <div className="w-50 rounded-2xl overflow-hidden bg-card border border-border shadow-menu">
            <ConversationActionsDropdownItem
                label={labels?.viewProfile ?? "View profile"}
                onClick={onViewProfileClick}
            />
            <ConversationActionsDropdownItem
                label={labels?.blockUser ?? "Block user"}
                onClick={onBlockUserClick}
                danger
            />
            <ConversationActionsDropdownItem
                label={labels?.reportUser ?? "Report user"}
                onClick={onReportUserClick}
                danger
            />
        </div>
    );
}
