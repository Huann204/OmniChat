import type { ConversationTag } from "./conversationTag";

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
  // Chỉ có khi hội thoại là nhóm (Conversation.isGroup) và tin do 1 thành
  // viên khác gửi — tên/avatar riêng của đúng người đó, khác với
  // customerName/customerAvatarUrl (tên/avatar của cả nhóm).
  senderName?: string;
  senderAvatarUrl?: string;
  // "Trả lời"/"Thả icon" — hiện chỉ Zalo hỗ trợ (Facebook không có API cho 2
  // việc này, xem server/src/services/channels/types.ts). replyPreviewText
  // = snippet tin gốc nếu tin NÀY là 1 lời trả lời trích dẫn. reactionIcon =
  // icon agent đã thả vào tin NÀY (chỉ tin của khách mới thả được).
  replyPreviewText?: string;
  reactionIcon?: string;
}

export interface Conversation {
  id: string;
  // pageId thật (Facebook) của Page mà hội thoại này thuộc về — dùng để phân
  // biệt nguồn khi đang xem gộp nhiều Page cùng lúc (/livechat).
  pageId: string;
  // Kênh của hội thoại — khớp CHANNEL_TYPE_* trong
  // server/src/models/connectedPage.model.ts (0 = Facebook, 1 = Zalo cá
  // nhân), lấy thẳng từ Conversation.type ở backend.
  type: number;
  customerName: string;
  customerAvatarUrl?: string;
  // true nếu đây là hội thoại nhóm (hiện chỉ Zalo có) — customerName/
  // customerAvatarUrl lúc đó là tên/avatar của NHÓM, không phải 1 khách.
  isGroup?: boolean;
  // Thẻ đang gắn cho hội thoại này (nhãn tự tạo theo Shop, xem
  // /settings/tags) — 1 hội thoại có thể mang nhiều thẻ cùng lúc.
  tags: ConversationTag[];
  lastSeenLabel: string;
  timeLabel: string;
  isRead: boolean;
  messages: ConversationMessage[];
  // Còn tin nhắn cũ hơn chưa tải hay không — dùng để quyết định có tải thêm
  // khi cuộn lên đầu khung chat hay không.
  hasMoreMessages: boolean;
}
