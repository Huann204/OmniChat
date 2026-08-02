export type MessageSender = "customer" | "page" | "system";

export type MessageKind =
  | "text"
  | "image"
  | "sticker"
  | "video"
  | "file"
  | "call_request"
  | "call_outgoing"
  | "call_missed";

export interface ConversationMessage {
  id: string;
  sender: MessageSender;
  kind: MessageKind;
  text?: string;
  meta?: string;
  attachmentUrl?: string;
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
  // pageId thật (Facebook) của Page mà hội thoại này thuộc về — dùng để phân
  // biệt nguồn khi đang xem gộp nhiều Page cùng lúc (/livechat).
  pageId: string;
  customerName: string;
  customerAvatarUrl?: string;
  lastSeenLabel: string;
  timeLabel: string;
  isRead: boolean;
  messages: ConversationMessage[];
}
