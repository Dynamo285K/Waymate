import { DomainError } from "../../shared/errors";

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

const CHAT_ERROR_STATUS: Record<ChatErrorCode, number> = {
    [ChatErrorCodes.ConversationNotFound]: 404,
    [ChatErrorCodes.BookingNotFound]: 404,
    [ChatErrorCodes.NotAParticipant]: 403,
    [ChatErrorCodes.Blocked]: 403,
    [ChatErrorCodes.BlockedByOther]: 403,
    [ChatErrorCodes.RecipientBanned]: 403,
    [ChatErrorCodes.MessageEmpty]: 400,
};

export class ChatError extends DomainError {
    readonly code: ChatErrorCode;
    constructor(code: ChatErrorCode) {
        super(code, CHAT_ERROR_STATUS[code]);
        this.code = code;
    }
}
