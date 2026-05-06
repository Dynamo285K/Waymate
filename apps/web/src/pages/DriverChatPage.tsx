import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ConversationSidebar,
    ChatHeader,
    MessageBubble,
    MessageComposer,
} from "@waymate/ui";
import type { Language } from "../components/controls/LanguageSwitcher";
import { DriverNavbar } from "../components/navigation/DriverNavbar";
import { useDriverNavbarProps } from "../hooks/useDriverNavbarProps";

type Message = {
    id: number;
    text: string;
    time: string;
    variant: "incoming" | "outgoing";
};

type Conversation = {
    id: string;
    name: string;
    lastMessage: string;
    messages: Message[];
};

const CONVERSATIONS: Conversation[] = [
    {
        id: "1",
        name: "Sarah Johnson",
        lastMessage: "See you at the pickup point!",
        messages: [
            {
                id: 1,
                text: "Hi! I saw you booked my ride to Brno.",
                time: "10:01 AM",
                variant: "incoming",
            },
            {
                id: 2,
                text: "Yes! I'm looking forward to it.",
                time: "10:03 AM",
                variant: "outgoing",
            },
            {
                id: 3,
                text: "Great the pickup is at the train station.",
                time: "10:04 AM",
                variant: "incoming",
            },
            {
                id: 4,
                text: "Perfect! I know where that is.",
                time: "10:09 AM",
                variant: "outgoing",
            },
            {
                id: 5,
                text: "See you at the pickup point!",
                time: "10:15 AM",
                variant: "incoming",
            },
        ],
    },
    {
        id: "2",
        name: "Mike Chen",
        lastMessage: "Thanks for booking.",
        messages: [
            {
                id: 1,
                text: "Thanks for booking.",
                time: "9:30 AM",
                variant: "incoming",
            },
        ],
    },
    {
        id: "3",
        name: "Emma Wilson",
        lastMessage: "What time works for you?",
        messages: [
            {
                id: 1,
                text: "What time works for you?",
                time: "8:45 AM",
                variant: "incoming",
            },
        ],
    },
];

type DriverChatPageProps = {
    language: Language;
    theme: "light" | "dark";
    onLanguageChange: (lang: Language) => void;
    onThemeToggle: () => void;
    userName?: string;
    userEmail?: string;
};

export function DriverChatPage({
    language,
    theme,
    onLanguageChange,
    onThemeToggle,
    userName,
    userEmail,
}: DriverChatPageProps) {
    const { t } = useTranslation();
    const navbarProps = useDriverNavbarProps({
        activeTab: "chat",
        language,
        onLanguageChange,
        theme,
        onThemeToggle,
        userName,
        userEmail,
    });
    const [activeId, setActiveId] = useState<string | null>(null);
    const [conversations, setConversations] = useState(CONVERSATIONS);

    const active = conversations.find((c) => c.id === activeId) ?? null;

    function handleSend(text: string) {
        if (!activeId) return;
        const time = new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
        setConversations((prev) =>
            prev.map((c) =>
                c.id === activeId
                    ? {
                          ...c,
                          lastMessage: text,
                          messages: [
                              ...c.messages,
                              {
                                  id: Date.now(),
                                  text,
                                  time,
                                  variant: "outgoing",
                              },
                          ],
                      }
                    : c
            )
        );
    }

    const chatHeaderLabels = {
        viewProfile: t("chat.viewProfile"),
        blockUser: t("chat.blockUser"),
        reportUser: t("chat.reportUser"),
    };

    return (
        <div
            data-theme={theme}
            className="min-h-screen bg-(--color-bg) flex flex-col"
        >
            <DriverNavbar {...navbarProps} />

            {/* Desktop: split view */}
            <div
                className="hidden md:flex flex-1 overflow-hidden"
                style={{ height: "calc(100vh - 72px)" }}
            >
                <ConversationSidebar
                    title={t("chat.messages")}
                    conversations={conversations}
                    activeConversationId={activeId ?? undefined}
                    onConversationClick={setActiveId}
                />
                {active ? (
                    <div className="flex flex-col flex-1 overflow-hidden">
                        <ChatHeader
                            name={active.name}
                            labels={chatHeaderLabels}
                        />
                        <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-4 bg-(--color-bg)">
                            {active.messages.map((msg) => (
                                <MessageBubble
                                    key={msg.id}
                                    message={msg.text}
                                    time={msg.time}
                                    variant={msg.variant}
                                />
                            ))}
                        </div>
                        <MessageComposer
                            placeholder={t("chat.typeMessage")}
                            onSend={handleSend}
                        />
                    </div>
                ) : (
                    <div className="flex flex-1 items-center justify-center text-(--color-text-secondary)">
                        {t("chat.messages")}
                    </div>
                )}
            </div>

            {/* Mobile: list OR chat */}
            <div className="flex md:hidden flex-1 flex-col overflow-hidden">
                {!active ? (
                    <ConversationSidebar
                        title={t("chat.messages")}
                        conversations={conversations}
                        activeConversationId={undefined}
                        onConversationClick={setActiveId}
                    />
                ) : (
                    <div className="flex flex-col flex-1 overflow-hidden">
                        <div className="flex items-center gap-3 px-4 py-3 border-b border-(--color-border) bg-(--color-card)">
                            <button
                                onClick={() => setActiveId(null)}
                                className="text-(--color-text-secondary) hover:text-(--color-text-primary) transition-colors"
                                aria-label="Back"
                            >
                                <svg
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M19 12H5M12 5l-7 7 7 7" />
                                </svg>
                            </button>
                            <ChatHeader
                                name={active.name}
                                labels={chatHeaderLabels}
                            />
                        </div>
                        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4 bg-(--color-bg)">
                            {active.messages.map((msg) => (
                                <MessageBubble
                                    key={msg.id}
                                    message={msg.text}
                                    time={msg.time}
                                    variant={msg.variant}
                                />
                            ))}
                        </div>
                        <MessageComposer
                            placeholder={t("chat.typeMessage")}
                            onSend={handleSend}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
