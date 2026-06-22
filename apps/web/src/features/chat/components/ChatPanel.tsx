import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ConversationSidebar,
    BackIcon,
    ChatHeader,
    IconButton,
} from "@waymate/ui";
import { useLayout } from "../../../lib/use-layout";
import { ReportUserModal } from "../../../components/shared/ReportUserModal";
import { UserProfileModal } from "../../../components/shared/UserProfileModal";
import { useChatPanel } from "../hooks/useChatPanel";
import { ChatThread } from "./ChatThread";
import { BlockConfirmModal } from "./BlockConfirmModal";

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
                        <ChatThread
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
                        <ChatThread
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

            <BlockConfirmModal
                open={confirmBlock}
                theme={theme}
                counterpartName={panel.activeName ?? ""}
                isBlocking={panel.isBlocking}
                onConfirm={confirmBlockUser}
                onClose={() => setConfirmBlock(false)}
            />
        </>
    );
}
