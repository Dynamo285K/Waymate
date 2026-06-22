import { Fragment, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { formatDayLabel } from "../../../lib/date-format";
import {
    Button,
    ConversationSidebar,
    BackIcon,
    ChatHeader,
    IconButton,
    MessageBubble,
    MessageComposer,
    Modal,
} from "@waymate/ui";
import { useLayout } from "../../../lib/use-layout";
import { ReportUserModal } from "../../../components/shared/ReportUserModal";
import { UserProfileModal } from "../../../components/shared/UserProfileModal";
import { useChatPanel, type MessageView } from "../hooks/useChatPanel";

type ThreadProps = {
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
function Thread({
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
}: ThreadProps) {
    const { t } = useTranslation();
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ block: "end" });
    }, [messages.length]);

    return (
        <>
            <div
                className={`flex-1 overflow-y-auto ${paddingClass} flex flex-col gap-4 bg-background`}
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
                <div className="px-6 py-4 border-t border-border bg-card max-600:px-4">
                    <span className="text-sm text-text-secondary">
                        {bannedNotice}
                    </span>
                </div>
            ) : blocked ? (
                <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-border bg-card max-600:px-4 max-600:flex-wrap">
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
                <MessageComposer
                    placeholder={placeholder}
                    onSend={(text) => {
                        if (!isSending) onSend(text);
                    }}
                />
            )}
        </>
    );
}

// Real-data chat experience (driver + passenger share this). The route renders
// the audience navbar around it; this component owns the conversation list,
// the open thread, and the responsive split/stacked layout.
type ChatPanelProps = {
    // Conversation to open on mount, typically the `conversation` URL search
    // param set by a booking's "Send message" action.
    initialConversationId?: string;
};

export function ChatPanel({ initialConversationId }: ChatPanelProps = {}) {
    const { t } = useTranslation();
    const { theme } = useLayout();
    const panel = useChatPanel(initialConversationId);
    const [confirmBlock, setConfirmBlock] = useState(false);
    const [openModal, setOpenModal] = useState<"report" | "profile" | null>(
        null
    );

    const chatHeaderLabels = {
        viewProfile: t("chat.viewProfile"),
        // Same menu entry toggles to "Unblock" once the user is blocked.
        blockUser: panel.isCounterpartBlockedByMe
            ? t("blocked.unblock")
            : t("chat.blockUser"),
        reportUser: t("chat.reportUser"),
    };

    const hasActive = panel.activeId !== null;

    // Block needs a confirm; unblock is harmless, so it fires directly.
    const onBlockToggle = panel.isCounterpartBlockedByMe
        ? panel.unblockActive
        : () => setConfirmBlock(true);

    const confirmBlockUser = () => {
        if (panel.activeCounterpartId) {
            panel.blockUser(panel.activeCounterpartId);
        }
        setConfirmBlock(false);
    };

    // The sidebar component has no slot for a blocked indicator, so we tag the
    // name itself.
    const sidebarConversations = panel.conversations.map((c) =>
        c.blocked ? { ...c, name: `${c.name} · ${t("chat.blockedShort")}` } : c
    );

    const threadBlockProps = {
        blocked: panel.isThreadBlocked,
        blockedNotice: panel.isCounterpartBlockedByMe
            ? t("chat.blockedNotice")
            : t(
                  "chat.blockedNoticeCounterpart",
                  "You cannot reply to this conversation."
              ),
        unblockLabel: t("blocked.unblock"),
        isUnblocking: panel.isUnblocking,
        onUnblock: panel.unblockActive,
        showUnblock: panel.isCounterpartBlockedByMe,
        recipientBanned: panel.isActiveCounterpartBanned,
        bannedNotice: t("chat.recipientBannedNotice"),
    };

    return (
        <>
            {/* Desktop: split view */}
            <div className="hidden md:flex flex-1 overflow-hidden h-[calc(100vh_-_72px)]">
                <ConversationSidebar
                    title={t("chat.messages")}
                    conversations={sidebarConversations}
                    activeConversationId={panel.activeId ?? undefined}
                    onConversationClick={panel.selectConversation}
                />
                {hasActive ? (
                    <div className="flex flex-col flex-1 overflow-hidden">
                        <ChatHeader
                            name={panel.activeName ?? ""}
                            labels={chatHeaderLabels}
                            onViewProfileClick={() => setOpenModal("profile")}
                            onReportUserClick={() => setOpenModal("report")}
                            onBlockUserClick={onBlockToggle}
                        />
                        <Thread
                            messages={panel.messages}
                            isLoading={panel.isLoadingMessages}
                            isSending={panel.isSending}
                            placeholder={t("chat.typeMessage")}
                            loadingLabel={t("chat.loading")}
                            onSend={panel.sendMessage}
                            paddingClass="px-6 py-6"
                            {...threadBlockProps}
                        />
                    </div>
                ) : (
                    <div className="flex flex-1 items-center justify-center text-text-secondary">
                        {t("chat.selectConversation")}
                    </div>
                )}
            </div>

            {/* Mobile: list OR chat */}
            <div className="flex md:hidden flex-1 flex-col overflow-hidden">
                {!hasActive ? (
                    <ConversationSidebar
                        title={t("chat.messages")}
                        conversations={sidebarConversations}
                        activeConversationId={undefined}
                        onConversationClick={panel.selectConversation}
                    />
                ) : (
                    <div className="flex flex-col flex-1 overflow-hidden">
                        <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
                            <IconButton
                                ariaLabel={t("chat.back")}
                                icon={<BackIcon />}
                                variant="ghost"
                                onClick={panel.clearSelection}
                            />
                            <ChatHeader
                                name={panel.activeName ?? ""}
                                labels={chatHeaderLabels}
                                onViewProfileClick={() =>
                                    setOpenModal("profile")
                                }
                                onReportUserClick={() => setOpenModal("report")}
                                onBlockUserClick={onBlockToggle}
                            />
                        </div>
                        <Thread
                            messages={panel.messages}
                            isLoading={panel.isLoadingMessages}
                            isSending={panel.isSending}
                            placeholder={t("chat.typeMessage")}
                            loadingLabel={t("chat.loading")}
                            onSend={panel.sendMessage}
                            paddingClass="px-4 py-4"
                            {...threadBlockProps}
                        />
                    </div>
                )}
            </div>

            {openModal === "report" && panel.activeCounterpartId && (
                <ReportUserModal
                    targetUserId={panel.activeCounterpartId}
                    targetName={panel.activeName ?? ""}
                    rideId={panel.activeRideId ?? undefined}
                    onClose={() => setOpenModal(null)}
                />
            )}

            {openModal === "profile" && panel.activeCounterpartId && (
                <UserProfileModal
                    userId={panel.activeCounterpartId}
                    name={panel.activeName ?? ""}
                    onClose={() => setOpenModal(null)}
                />
            )}

            <Modal
                open={confirmBlock}
                onClose={() => setConfirmBlock(false)}
                theme={theme}
            >
                <div className="w-modal-viewport max-w-md p-6">
                    <h2 className="text-lg font-bold text-text-primary mb-2">
                        {t("chat.blockConfirmTitle", {
                            name: panel.activeName ?? "",
                        })}
                    </h2>
                    <p className="text-sm text-text-secondary mb-6">
                        {t("chat.blockConfirmText")}
                    </p>
                    <div className="flex gap-3 justify-end">
                        <Button
                            variant="secondary"
                            onClick={() => setConfirmBlock(false)}
                            disabled={panel.isBlocking}
                        >
                            {t("chat.cancel")}
                        </Button>
                        <Button
                            variant="red"
                            onClick={confirmBlockUser}
                            disabled={panel.isBlocking}
                        >
                            {t("chat.blockUser")}
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
}
