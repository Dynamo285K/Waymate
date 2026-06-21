import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import type { conversations } from "../../db/schema/conversation";
import type { messages } from "../../db/schema/message";
import type {
    ConversationRole,
    Message,
    PublicUserPreview,
} from "@repo/shared";

// ==========================================
// 1. BASE DATABASE TYPES (SELECT)
// ==========================================
export type Conversation = InferSelectModel<typeof conversations>;
export type MessageRow = InferSelectModel<typeof messages>;

// ==========================================
// 2. DATABASE TYPES FOR INSERTION (INSERT)
// ==========================================
export type ConversationInsert = InferInsertModel<typeof conversations>;
export type MessageInsert = InferInsertModel<typeof messages>;

// ==========================================
// 3. SPECIFIC PROPERTIES AND ALIASES
// ==========================================
export type ConversationType = Conversation["conversationType"];
export type MessageType = MessageRow["messageType"];

// Resolved participants of a booking-scoped conversation. Both parties are
// derived from the booking + its ride; the schema only models a two-party
// (driver / passenger) conversation.
export type ConversationParticipants = {
    conversationId: string | null;
    bookingId: string;
    rideId: string;
    driverId: string;
    passengerId: string;
};

// ==========================================
// 4. SERVICE / REPOSITORY CONTRACTS (COMPOSITE TYPES)
// ==========================================

// How a single conversation appears in the authenticated user's inbox.
export type ConversationListItem = {
    id: string;
    conversationType: ConversationType;
    bookingId: string | null;
    rideId: string | null;
    myRole: ConversationRole;
    counterpart: PublicUserPreview;
    lastMessage: Message | null;
    unreadCount: number;
    updatedAt: Date;
    isBlocked: boolean;
};
