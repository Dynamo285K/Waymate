import { assertNever, DomainError } from "../../shared/errors";

export const ChatErrorCodes = {
    ConversationNotFound: "CHAT_CONVERSATION_NOT_FOUND",
    BookingNotFound: "CHAT_BOOKING_NOT_FOUND",
    NotAParticipant: "CHAT_NOT_A_PARTICIPANT",
    MessageEmpty: "CHAT_MESSAGE_EMPTY",
    Blocked: "CHAT_BLOCKED",
    BlockedByOther: "CHAT_BLOCKED_BY_OTHER",
    RecipientBanned: "CHAT_RECIPIENT_BANNED",
} as const;

export type ChatErrorCode =
    (typeof ChatErrorCodes)[keyof typeof ChatErrorCodes];

export class ChatError extends DomainError {
    readonly code: ChatErrorCode;
    constructor(code: ChatErrorCode) {
        super(code);
        this.code = code;
    }
}

export function chatErrorToHttpStatus(code: ChatErrorCode): number {
    switch (code) {
        case ChatErrorCodes.ConversationNotFound:
        case ChatErrorCodes.BookingNotFound:
            return 404;
        case ChatErrorCodes.NotAParticipant:
        case ChatErrorCodes.Blocked:
        case ChatErrorCodes.BlockedByOther:
        case ChatErrorCodes.RecipientBanned:
            return 403;
        case ChatErrorCodes.MessageEmpty:
            return 400;
        default:
            return assertNever(code);
    }
}
