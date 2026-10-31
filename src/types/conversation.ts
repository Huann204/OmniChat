import type { ConversationTag } from "./conversationTag";

export type MessageSender = "customer" | "page" | "system";

export type MessageKind =
  | "text"
  | "image"
  | "sticker"
  // Sticker Lottie của Telegram (.tgs) — JSON animation nén gzip, khác hẳn
  // "sticker" (ảnh tĩnh), cần render riêng bằng LottieSticker.tsx.
  | "lottie"
  | "video"
  | "file"
  // Link chia sẻ (dán URL, Zalo tự tạo preview card kèm ảnh/tiêu đề/mô tả)
  // — render thẻ riêng qua `linkPreview` bên dưới, khác "file".
  | "link"
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
  // Chỉ có khi kind="link" — thẻ xem trước link chia sẻ (ảnh thumb/tiêu đề/
  // mô tả trang đích), xem lib/message-format.ts#LinkPreview.
  linkPreview?: { url: string; name?: string; description?: string; thumb?: string };
  time: string;
  // ISO timestamp gốc — dùng làm cursor phân trang khi tải thêm tin nhắn cũ
  // hơn (before/beforeId), khác với `time` vốn chỉ để hiển thị (đã format).
  createdAt: string;
  // Chỉ có ý nghĩa với tin của Page tự gửi (đang hiện optimistic trước khi
  // server xác nhận) — undefined nghĩa là tin đã xác nhận từ trước (tải từ
  // DB, hoặc do khách/nơi khác gửi), coi như "sent".
  status?: "sending" | "sent" | "failed";
  // 2 ý nghĩa tuỳ sender: sender="customer" trong hội thoại NHÓM (Conversation.isGroup)
  // — tên/avatar riêng của đúng thành viên khách đã gửi, khác
  // customerName/customerAvatarUrl (tên/avatar cả nhóm). sender="page" — tên
  // NHÂN VIÊN thật đã gửi (server resolve từ Message.sentBy), rơi về "Bạn"
  // nếu chưa resolve được, xem MessageThread.tsx.
  senderName?: string;
  senderAvatarUrl?: string;
  // Tin do chatbot tự động gửi (xem server/src/services/chatbotAutoReply.service.ts)
  // — MessageThread.tsx hiện "🤖 Trợ lý AI" thay vì "Bạn" cho tin này, để nhân
  // viên phân biệt được tin bot gửi với tin đồng nghiệp thật gửi.
  sentByBot?: boolean;
  // "Trả lời"/"Thả icon" — hiện chỉ Zalo hỗ trợ (Facebook không có API cho 2
  // việc này, xem server/src/services/channels/types.ts). replyPreviewText
  // = snippet tin gốc nếu tin NÀY là 1 lời trả lời trích dẫn. reactionIcon =
  // icon agent đã thả vào tin NÀY (chỉ tin của khách mới thả được).
  replyPreviewText?: string;
  // id (không phải clientId) của ĐÚNG Message gốc bị trả lời — chỉ có khi tin
  // gốc đó vẫn còn trong hệ thống (đã từng ingest). Dùng để bấm vào khung
  // trích dẫn thì cuộn/nhảy tới đúng tin gốc, xem MessageThread.tsx.
  replyToMessageId?: string;
  reactionIcon?: string;
  // "@nhắc tên" thành viên nhóm có trong `text` (chỉ Zalo nhóm) — pos/len
  // tính theo `text` ở trên, dùng để bôi đậm đúng đoạn "@Tên" lúc hiển thị,
  // xem MessageThread.tsx#FormattedMessageText.
  mentions?: { uid: string; pos: number; len: number }[];
  // Chỉ có ở tin Page vừa tự gửi (đang optimistic) — id tạm tự sinh lúc gửi,
  // KHÁC `id` (đổi sang id thật ngay khi có phản hồi từ server, xem
  // InboxView.tsx#handleSend). Giữ riêng field này để cơ chế chống trùng
  // echo qua socket vẫn nhận ra đúng tin dù `id` đã đổi.
  clientId?: string;
}

export interface Conversation {
  id: string;
  // pageId thật (Facebook) của Page mà hội thoại này thuộc về — dùng để phân
  // biệt nguồn khi đang xem gộp nhiều Page cùng lúc (/livechat).
  pageId: string;
  // Kênh của hội thoại — khớp CHANNEL_TYPE_* trong
  // server/src/models/connectedPage.model.ts (0 = Facebook, 1 = Zalo cá
  // nhân, 2 = Telegram), lấy thẳng từ Conversation.type ở backend.
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
  // ISO timestamp gốc — dùng làm cursor phân trang khi tải thêm hội thoại cũ
  // hơn (before/beforeId), khác `timeLabel` vốn chỉ để hiển thị (đã format).
  lastMessageAt: string;
  isRead: boolean;
  // true nếu Page của hội thoại này đã gán 1 chatbot đang "Xuất bản" (xem
  // ChatbotConfig.autoReplyEnabled) — cho ConversationList.tsx/ChatHeader.tsx
  // hiện badge "🤖 AI đang bật", để nhân viên biết ngay không cần vào riêng
  // Cài đặt > Trợ lý AI để kiểm tra. Tính 1 lần lúc tải danh sách/trang, KHÔNG
  // tự cập nhật qua socket nếu Shop đổi trạng thái xuất bản giữa lúc đang mở
  // sẵn Livechat (hiếm khi xảy ra, chấp nhận lệch tạm thời tới lần tải lại
  // sau).
  botActive?: boolean;
  // true = bot đang TẠM im lặng cho đúng hội thoại này vì nhân viên vừa tự
  // tay gửi tin gần đây (30 phút, xem server/src/models/conversation.model.ts#botPausedUntil)
  // — khác hẳn botActive=false (Page chưa hề bật bot). Chỉ có ý nghĩa khi
  // botActive=true.
  botPaused?: boolean;
  // Nhân viên đang phụ trách hội thoại (id User) — undefined = chưa ai nhận.
  // Chỉ lưu id; tên/avatar tra từ danh sách thành viên Shop (xem
  // InboxView.tsx#membersById), không nhân bản vào từng hội thoại.
  assigneeId?: string;
  messages: ConversationMessage[];
  // Còn tin nhắn cũ hơn chưa tải hay không — dùng để quyết định có tải thêm
  // khi cuộn lên đầu khung chat hay không.
  hasMoreMessages: boolean;
}
