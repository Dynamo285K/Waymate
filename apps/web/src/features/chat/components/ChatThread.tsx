import { Fragment, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Button } from "@/components/ui/Button";
import { MessageBubble } from "@/features/chat/components/MessageBubble";
import { MessageComposer } from "@/features/chat/components/MessageComposer";
import { PenIcon } from "@/components/ui/icons/PenIcon";
import { TrashIcon } from "@/components/ui/icons/TrashIcon";
import { formatDayLabel } from "../../../lib/date-format";
import { type MessageView } from "../hooks/useChatPanel";
import { DeleteMessageConfirmModal } from "./DeleteMessageConfirmModal";

// Three vertical dots (Messenger-style message actions trigger) — @waymate/ui
// ships no such icon.
function DotsIcon() {
    return (
        <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
        >
            <circle
                cx="12"
                cy="5"
                r="2"
            />
            <circle
                cx="12"
                cy="12"
                r="2"
            />
            <circle
                cx="12"
                cy="19"
                r="2"
            />
        </svg>
    );
}

type ChatThreadProps = {
    messages: MessageView[];
    isLoading: boolean;
    isSending: boolean;
    placeholder: string;
    loadingLabel: string;
    onSend: (text: string) => void;
    onEditMessage: (messageId: string, text: string) => void;
    onDeleteMessage: (messageId: string) => void;
    theme: "light" | "dark";
    paddingClass: string;
    blocked: boolean;
    blockedNotice: string;
    unblockLabel: string;
    isUnblocking: boolean;
    onUnblock: () => void;
    showUnblock?: boolean;
    recipientBanned: boolean;
    bannedNotice: string;
    hasOlder: boolean;
    isLoadingOlder: boolean;
    onLoadOlder: () => void;
};

// The scrollable message list + composer, shared by the desktop and mobile
// layouts. Auto-scrolls to the newest message as the thread grows; scrolling
// to the top loads older pages (infinite scroll) without the viewport
// jumping. When the counterpart is blocked, the composer is replaced by a
// notice + Unblock.
export function ChatThread({
    messages,
    isLoading,
    isSending,
    placeholder,
    loadingLabel,
    onSend,
    onEditMessage,
    onDeleteMessage,
    theme,
    paddingClass,
    blocked,
    blockedNotice,
    unblockLabel,
    isUnblocking,
    onUnblock,
    showUnblock = true,
    recipientBanned,
    bannedNotice,
    hasOlder,
    isLoadingOlder,
    onLoadOlder,
}: ChatThreadProps) {
    const { t } = useTranslation();
    const containerRef = useRef<HTMLDivElement>(null);
    const topSentinelRef = useRef<HTMLDivElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);

    // Genuine UI state: which own message is being edited inline (with its
    // draft) and which one awaits delete confirmation.
    const [editing, setEditing] = useState<{
        id: string;
        draft: string;
    } | null>(null);
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

    const saveEdit = () => {
        if (!editing) return;
        const content = editing.draft.trim();
        if (content) onEditMessage(editing.id, content);
        setEditing(null);
    };

    const confirmDelete = () => {
        if (pendingDeleteId) onDeleteMessage(pendingDeleteId);
        setPendingDeleteId(null);
    };

    // Scroll-height snapshot taken right before an older page is requested, so
    // the anchoring effect below knows how much content was prepended.
    const scrollHeightBeforeLoadRef = useRef(0);
    const prevFirstIdRef = useRef<string | null>(null);
    const prevLastIdRef = useRef<string | null>(null);

    const firstId = messages[0]?.id ?? null;
    const lastId = messages.at(-1)?.id ?? null;

    // Anchor the viewport across list changes: a new last message (send,
    // incoming, conversation switch) scrolls to the bottom; a prepended older
    // page keeps the currently visible messages in place by offsetting
    // scrollTop by exactly the added height.
    useLayoutEffect(() => {
        const container = containerRef.current;
        if (lastId !== prevLastIdRef.current) {
            bottomRef.current?.scrollIntoView({ block: "end" });
        } else if (firstId !== prevFirstIdRef.current && container) {
            container.scrollTop +=
                container.scrollHeight - scrollHeightBeforeLoadRef.current;
        }
        prevFirstIdRef.current = firstId;
        prevLastIdRef.current = lastId;
    }, [firstId, lastId]);

    // Load older messages when the top sentinel scrolls into view. Kept in
    // refs so the observer survives re-renders without reconnecting.
    const loadOlderRef = useRef({ hasOlder, isLoadingOlder, onLoadOlder });
    useEffect(() => {
        loadOlderRef.current = { hasOlder, isLoadingOlder, onLoadOlder };
    });
    useEffect(() => {
        const container = containerRef.current;
        const sentinel = topSentinelRef.current;
        // jsdom (tests) has no IntersectionObserver.
        if (!container || !sentinel || !("IntersectionObserver" in window)) {
            return;
        }
        const observer = new IntersectionObserver(
            (entries) => {
                const current = loadOlderRef.current;
                if (
                    entries.some((e) => e.isIntersecting) &&
                    current.hasOlder &&
                    !current.isLoadingOlder
                ) {
                    scrollHeightBeforeLoadRef.current = container.scrollHeight;
                    current.onLoadOlder();
                }
            },
            { root: container }
        );
        observer.observe(sentinel);
        return () => observer.disconnect();
    }, []);

    return (
        <>
            <div
                ref={containerRef}
                className={`min-h-0 flex-1 overflow-y-auto ${paddingClass} flex flex-col gap-4 bg-background`}
            >
                {/* Always rendered so the mount-once IntersectionObserver
                    effect finds it even while the thread is still loading
                    (hasOlder is false then, so it can't trigger a fetch). */}
                <div ref={topSentinelRef} />
                {isLoadingOlder && (
                    <div className="self-center text-xs text-text-secondary bg-card border border-border rounded-full px-3 py-1 my-1">
                        {t("chat.loadingOlder")}
                    </div>
                )}
                {isLoading ? (
                    <div className="m-auto text-text-secondary">
                        {loadingLabel}
                    </div>
                ) : (
                    <>
                        {messages.map((msg, i) => {
                            const prev = messages[i - 1];
                            const newDay =
                                !prev ||
                                new Date(prev.sentAt).toDateString() !==
                                    new Date(msg.sentAt).toDateString();
                            const outgoing = msg.variant === "outgoing";
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
                                    {editing?.id === msg.id ? (
                                        <div className="self-end flex w-full max-w-md flex-col items-end gap-1">
                                            {/* Messenger-style inline edit: a
                                                bubble-shaped textarea; Enter
                                                saves, Esc cancels. Raw element
                                                because @waymate/ui Textarea
                                                exposes no keyboard events. */}
                                            <textarea
                                                autoFocus
                                                value={editing.draft}
                                                rows={Math.min(
                                                    6,
                                                    editing.draft.split("\n")
                                                        .length + 1
                                                )}
                                                maxLength={2000}
                                                className="w-full resize-none rounded-2xl border border-border bg-card px-4 py-2.5 text-sm text-text-primary outline-none focus:border-primary"
                                                onChange={(e) =>
                                                    setEditing({
                                                        id: msg.id,
                                                        draft: e.target.value,
                                                    })
                                                }
                                                onKeyDown={(e) => {
                                                    if (
                                                        e.key === "Enter" &&
                                                        !e.shiftKey
                                                    ) {
                                                        e.preventDefault();
                                                        saveEdit();
                                                    } else if (
                                                        e.key === "Escape"
                                                    ) {
                                                        setEditing(null);
                                                    }
                                                }}
                                            />
                                            <div className="flex items-center gap-3 px-1 text-caption text-text-secondary">
                                                <button
                                                    type="button"
                                                    className="cursor-pointer border-0 bg-transparent p-0 text-caption text-text-secondary hover:underline"
                                                    onClick={() =>
                                                        setEditing(null)
                                                    }
                                                >
                                                    {t("chat.cancel")}
                                                </button>
                                                <button
                                                    type="button"
                                                    className="cursor-pointer border-0 bg-transparent p-0 text-caption font-semibold text-primary hover:underline"
                                                    onClick={saveEdit}
                                                >
                                                    {t("chat.save")}
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div
                                            className={`group flex w-full items-center gap-1.5 ${
                                                outgoing
                                                    ? "justify-end"
                                                    : "justify-start"
                                            }`}
                                        >
                                            {outgoing && msg.canModify && (
                                                <DropdownMenu.Root>
                                                    <DropdownMenu.Trigger
                                                        aria-label={t(
                                                            "chat.messageActions"
                                                        )}
                                                        className="inline-flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent text-text-secondary opacity-0 transition-opacity hover:bg-border focus-visible:opacity-100 group-hover:opacity-100 data-[state=open]:bg-border data-[state=open]:opacity-100"
                                                    >
                                                        <DotsIcon />
                                                    </DropdownMenu.Trigger>
                                                    <DropdownMenu.Portal>
                                                        <DropdownMenu.Content
                                                            className="z-200 min-w-44 overflow-hidden rounded-summary-card border border-border bg-card py-1 shadow-dropdown-strong"
                                                            // Open beside the dots at their level (Messenger-style),
                                                            // not underneath; Radix flips it near viewport edges.
                                                            side="left"
                                                            align="center"
                                                            sideOffset={6}
                                                            collisionPadding={8}
                                                            data-theme={theme}
                                                        >
                                                            <DropdownMenu.Item
                                                                className="flex cursor-pointer items-center gap-2.5 px-3.5 py-2 text-sm text-text-primary outline-none data-highlighted:bg-border icon-svg:h-4 icon-svg:w-4"
                                                                onSelect={() =>
                                                                    setEditing({
                                                                        id: msg.id,
                                                                        draft: msg.message,
                                                                    })
                                                                }
                                                            >
                                                                <PenIcon />
                                                                {t(
                                                                    "chat.editAction"
                                                                )}
                                                            </DropdownMenu.Item>
                                                            <DropdownMenu.Item
                                                                className="flex cursor-pointer items-center gap-2.5 px-3.5 py-2 text-sm text-red outline-none data-highlighted:bg-border icon-svg:h-4 icon-svg:w-4"
                                                                // Deferred a tick so the menu finishes closing (and
                                                                // returning focus) before the modal's focus trap
                                                                // takes over — opening both at once makes the two
                                                                // focus scopes fight.
                                                                onSelect={() =>
                                                                    setTimeout(
                                                                        () =>
                                                                            setPendingDeleteId(
                                                                                msg.id
                                                                            ),
                                                                        0
                                                                    )
                                                                }
                                                            >
                                                                <TrashIcon />
                                                                {t(
                                                                    "chat.deleteAction"
                                                                )}
                                                            </DropdownMenu.Item>
                                                        </DropdownMenu.Content>
                                                    </DropdownMenu.Portal>
                                                </DropdownMenu.Root>
                                            )}
                                            {/* MessageBubble caps itself at
                                                max-width:70% OF ITS PARENT.
                                                This wrapper is shrink-to-fit
                                                (so the actions button hugs the
                                                bubble), which would make that
                                                percentage collapse to nothing
                                                — so the wrapper carries the
                                                70%-of-row cap itself and the
                                                bubble's own cap is lifted to
                                                100% of the wrapper. */}
                                            <span
                                                className={`flex min-w-0 max-w-[70%] flex-col [&_.max-w-message]:max-w-full ${
                                                    outgoing
                                                        ? "items-end"
                                                        : "items-start"
                                                }`}
                                            >
                                                {msg.isDeleted ? (
                                                    <span
                                                        className={`rounded-full border border-border px-3.5 py-1.5 text-sm italic text-text-secondary ${
                                                            outgoing
                                                                ? "self-end"
                                                                : "self-start"
                                                        }`}
                                                    >
                                                        {t(
                                                            "chat.messageDeleted"
                                                        )}
                                                    </span>
                                                ) : (
                                                    <MessageBubble
                                                        message={msg.message}
                                                        time={msg.time}
                                                        variant={msg.variant}
                                                    />
                                                )}
                                                {msg.isEdited &&
                                                    !msg.isDeleted && (
                                                        <span
                                                            className={`mt-0.5 text-badge text-text-secondary ${
                                                                outgoing
                                                                    ? "self-end"
                                                                    : "self-start"
                                                            }`}
                                                        >
                                                            {t("chat.edited")}
                                                        </span>
                                                    )}
                                            </span>
                                        </div>
                                    )}
                                </Fragment>
                            );
                        })}
                    </>
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
            <DeleteMessageConfirmModal
                open={pendingDeleteId !== null}
                theme={theme}
                onConfirm={confirmDelete}
                onClose={() => setPendingDeleteId(null)}
            />
        </>
    );
}
