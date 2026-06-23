import { Fragment, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Button, MessageBubble, MessageComposer } from "@waymate/ui";
import { formatDayLabel } from "../../../lib/date-format";
import { type MessageView } from "../hooks/useChatPanel";

type ChatThreadProps = {
    messages: MessageView[];
    isLoading: boolean;
    isSending: boolean;
    placeholder: string;
    loadingLabel: string;
    onSend: (text: string) => void;
    paddingClass: string;
    blocked: boolean;
    blockedNotice: string;
    unblockLabel: string;
    isUnblocking: boolean;
    onUnblock: () => void;
    showUnblock?: boolean;
    recipientBanned: boolean;
    bannedNotice: string;
};

// The scrollable message list + composer, shared by the desktop and mobile
// layouts. Auto-scrolls to the newest message as the thread grows. When the
// counterpart is blocked, the composer is replaced by a notice + Unblock.
export function ChatThread({
    messages,
    isLoading,
    isSending,
    placeholder,
    loadingLabel,
    onSend,
    paddingClass,
    blocked,
    blockedNotice,
    unblockLabel,
    isUnblocking,
    onUnblock,
    showUnblock = true,
    recipientBanned,
    bannedNotice,
}: ChatThreadProps) {
    const { t } = useTranslation();
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ block: "end" });
    }, [messages.length]);

    return (
        <>
            <div
                className={`min-h-0 flex-1 overflow-y-auto ${paddingClass} flex flex-col gap-4 bg-background`}
            >
                {isLoading ? (
                    <div className="m-auto text-text-secondary">
                        {loadingLabel}
                    </div>
                ) : (
                    messages.map((msg, i) => {
                        const prev = messages[i - 1];
                        const newDay =
                            !prev ||
                            new Date(prev.sentAt).toDateString() !==
                                new Date(msg.sentAt).toDateString();
                        return (
                            <Fragment key={msg.id}>
                                {newDay && (
                                    <div className="self-center text-xs text-text-secondary bg-card border border-border rounded-full px-3 py-1 my-1">
                                        {formatDayLabel(
                                            msg.sentAt,
                                            t("chat.today"),
                                            t("chat.yesterday")
                                        )}
                                    </div>
                                )}
                                <MessageBubble
                                    message={msg.message}
                                    time={msg.time}
                                    variant={msg.variant}
                                />
                            </Fragment>
                        );
                    })
                )}
                <div ref={bottomRef} />
            </div>
            {recipientBanned ? (
                // The counterpart's account is banned — no composer at all, and
                // no unblock (this isn't a block the user can lift).
                <div className="shrink-0 px-6 py-4 border-t border-border bg-card max-600:px-4">
                    <span className="text-sm text-text-secondary">
                        {bannedNotice}
                    </span>
                </div>
            ) : blocked ? (
                <div className="shrink-0 flex items-center justify-between gap-3 px-6 py-4 border-t border-border bg-card max-600:px-4 max-600:flex-wrap">
                    <span className="text-sm text-text-secondary">
                        {blockedNotice}
                    </span>
                    {showUnblock && (
                        <Button
                            variant="secondary"
                            onClick={onUnblock}
                            disabled={isUnblocking}
                        >
                            {unblockLabel}
                        </Button>
                    )}
                </div>
            ) : (
                <div className="shrink-0">
                    <MessageComposer
                        placeholder={placeholder}
                        onSend={(text) => {
                            if (!isSending) onSend(text);
                        }}
                    />
                </div>
            )}
        </>
    );
}
