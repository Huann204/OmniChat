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
  // Có thể nhiều ảnh trong 1 tin nhắn (Facebook gộp qua message.attachments
  // dạng mảng) — sticker/video/file luôn chỉ có đúng 1 phần tử.
  attachmentUrls?: string[];
  time: string;
  // ISO timestamp gốc — dùng làm cursor phân trang khi tải thêm tin nhắn cũ
  // hơn (before/beforeId), khác với `time` vốn chỉ để hiển thị (đã format).
  createdAt: string;
  // Chỉ có ý nghĩa với tin của Page tự gửi (đang hiện optimistic trước khi
  // server xác nhận) — undefined nghĩa là tin đã xác nhận từ trước (tải từ
  // DB, hoặc do khách/nơi khác gửi), coi như "sent".
  status?: "sending" | "sent" | "failed";
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
  // Còn tin nhắn cũ hơn chưa tải hay không — dùng để quyết định có tải thêm
  // khi cuộn lên đầu khung chat hay không.
  hasMoreMessages: boolean;
}
