export type MessageSender = "customer" | "page" | "system";

export type MessageKind =
  | "text"
  | "call_request"
  | "call_outgoing"
  | "call_missed";

export interface ConversationMessage {
  id: string;
  sender: MessageSender;
  kind: MessageKind;
  text?: string;
  meta?: string;
  time: string;
}

export type ConversationTagId =
  | "checking"
  | "question"
  | "purchase"
  | "shipped"
  | "out_of_stock"
  | "returned";

export interface Conversation {
  id: string;
  botId: string;
  customerName: string;
  customerAvatarUrl?: string;
  lastSeenLabel: string;
  timeLabel: string;
  isRead: boolean;
  messages: ConversationMessage[];
}
