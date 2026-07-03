import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
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
    hasOlder: false,
    isLoadingOlder: false,
    onLoadOlder: vi.fn(),
    onEditMessage: vi.fn(),
    onDeleteMessage: vi.fn(),
    theme: "light" as const,
};

const message: MessageView = {
    id: "m1",
    message: "Hello there",
    time: "08:00",
    sentAt: new Date().toISOString(),
    variant: "incoming",
    isEdited: false,
    isDeleted: false,
    canModify: false,
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

    it("shows the older-messages indicator while an older page loads", () => {
        render(
            <ChatThread
                {...baseProps}
                messages={[message]}
                hasOlder={true}
                isLoadingOlder={true}
            />
        );
        expect(screen.getByText("Loading older messages…")).toBeInTheDocument();
    });

    it("does not show the older-messages indicator when idle", () => {
        render(
            <ChatThread
                {...baseProps}
                messages={[message]}
                hasOlder={true}
            />
        );
        expect(
            screen.queryByText("Loading older messages…")
        ).not.toBeInTheDocument();
    });

    it("renders a tombstone instead of the content for a deleted message", () => {
        render(
            <ChatThread
                {...baseProps}
                messages={[{ ...message, message: "", isDeleted: true }]}
            />
        );
        expect(screen.getByText("Message deleted")).toBeInTheDocument();
        expect(screen.queryByText("Hello there")).not.toBeInTheDocument();
    });

    it("shows the edited marker on an edited message", () => {
        render(
            <ChatThread
                {...baseProps}
                messages={[{ ...message, isEdited: true }]}
            />
        );
        expect(screen.getByText("Hello there")).toBeInTheDocument();
        expect(screen.getByText("edited")).toBeInTheDocument();
    });

    it("shows the actions menu trigger only for own modifiable messages", () => {
        const { rerender } = render(
            <ChatThread
                {...baseProps}
                messages={[
                    { ...message, variant: "outgoing", canModify: true },
                ]}
            />
        );
        expect(
            screen.getByRole("button", { name: "Message actions" })
        ).toBeInTheDocument();

        rerender(
            <ChatThread
                {...baseProps}
                messages={[{ ...message, canModify: false }]}
            />
        );
        expect(
            screen.queryByRole("button", { name: "Message actions" })
        ).not.toBeInTheDocument();
    });

    it("asks for confirmation and only then fires the delete callback", async () => {
        const onDeleteMessage = vi.fn();
        render(
            <ChatThread
                {...baseProps}
                onDeleteMessage={onDeleteMessage}
                messages={[
                    { ...message, variant: "outgoing", canModify: true },
                ]}
            />
        );

        // Radix opens the menu on keyboard activation in jsdom.
        fireEvent.keyDown(
            screen.getByRole("button", { name: "Message actions" }),
            { key: "Enter" }
        );
        fireEvent.click(
            await screen.findByRole("menuitem", { name: "Delete message" })
        );
        expect(onDeleteMessage).not.toHaveBeenCalled();

        // The confirm modal opens a tick after the menu closes.
        fireEvent.click(
            await screen.findByRole("button", { name: "Delete message" })
        );
        expect(onDeleteMessage).toHaveBeenCalledWith("m1");
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
