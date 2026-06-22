import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "../../../i18n";
import { ChatThread } from "./ChatThread";
import type { MessageView } from "../hooks/useChatPanel";

const baseProps = {
    messages: [] as MessageView[],
    isLoading: false,
    isSending: false,
    placeholder: "Type a message...",
    loadingLabel: "Loading messages…",
    onSend: vi.fn(),
    paddingClass: "px-6 py-6",
    blocked: false,
    blockedNotice: "You blocked this user.",
    unblockLabel: "Unblock",
    isUnblocking: false,
    onUnblock: vi.fn(),
    showUnblock: true,
    recipientBanned: false,
    bannedNotice: "This account is banned.",
};

const message: MessageView = {
    id: "m1",
    message: "Hello there",
    time: "08:00",
    sentAt: new Date().toISOString(),
    variant: "incoming",
};

describe("ChatThread", () => {
    it("shows the composer in the normal (unblocked) state", () => {
        render(<ChatThread {...baseProps} />);
        expect(
            screen.getByPlaceholderText("Type a message...")
        ).toBeInTheDocument();
    });

    it("renders message content", () => {
        render(
            <ChatThread
                {...baseProps}
                messages={[message]}
            />
        );
        expect(screen.getByText("Hello there")).toBeInTheDocument();
    });

    it("shows the loading label in the message area while messages load", () => {
        render(
            <ChatThread
                {...baseProps}
                isLoading={true}
            />
        );
        expect(screen.getByText("Loading messages…")).toBeInTheDocument();
        // The composer stays available during loading — you can compose a
        // message before the history finishes fetching.
        expect(
            screen.getByPlaceholderText("Type a message...")
        ).toBeInTheDocument();
    });

    it("replaces the composer with a notice + unblock when blocked", () => {
        render(
            <ChatThread
                {...baseProps}
                blocked={true}
            />
        );
        expect(screen.getByText("You blocked this user.")).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: "Unblock" })
        ).toBeInTheDocument();
        expect(
            screen.queryByPlaceholderText("Type a message...")
        ).not.toBeInTheDocument();
    });

    it("hides the unblock button when the block isn't the viewer's to lift", () => {
        render(
            <ChatThread
                {...baseProps}
                blocked={true}
                showUnblock={false}
            />
        );
        expect(screen.getByText("You blocked this user.")).toBeInTheDocument();
        expect(
            screen.queryByRole("button", { name: "Unblock" })
        ).not.toBeInTheDocument();
    });

    it("shows only the banned notice for a banned counterpart", () => {
        render(
            <ChatThread
                {...baseProps}
                recipientBanned={true}
            />
        );
        expect(screen.getByText("This account is banned.")).toBeInTheDocument();
        expect(
            screen.queryByPlaceholderText("Type a message...")
        ).not.toBeInTheDocument();
        expect(
            screen.queryByRole("button", { name: "Unblock" })
        ).not.toBeInTheDocument();
    });
});
