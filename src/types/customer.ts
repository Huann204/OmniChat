import type { ConversationTag } from "./conversationTag";

// Trang "Khách hàng" — KHÔNG phải 1 thực thể dữ liệu mới, chỉ là góc nhìn
// khác của Conversation đã có sẵn (xem server/src/controllers/customer.controller.ts).
// 1 Conversation = 1 khách trên 1 kênh, khách nhắn qua 2 kênh khác nhau hiện
// thành 2 dòng RIÊNG, không tự gộp — đúng theo yêu cầu đã chốt.
export interface Customer {
  id: string;
  // _id Mongo của ConnectedPage — dùng để mở đúng Page này trong Livechat
  // (setMergePagesCookie), KHÁC pageId bên dưới (id ngoài theo kênh, chỉ để
  // hiển thị).
  connectedPageId: string;
  pageId: string;
  pageName: string;
  // Kênh: đồng bộ CHANNEL_TYPE_* trong connectedPage.model.ts.
  type: number;
  customerName: string;
  customerAvatarUrl?: string;
  // Không kênh nào (Facebook/Zalo/Telegram) tự cấp sẵn 3 field này qua API
  // nền tảng — nhân viên tự nhập tay khi cần (xem CustomerDetailModal.tsx).
  // Riêng Website: tự điền sẵn nếu Shop có cấu hình trường "phone"/"email"
  // trong form trước khi chat, vẫn sửa tay được sau đó như các kênh khác.
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
  lastMessage?: string;
  lastMessageAt: string;
  tags: ConversationTag[];
  // Chỉ có ý nghĩa với kênh Website — thông tin khách tự điền qua form
  // "trước khi chat" (xem widgetConfig.preChatFields). Key là "variable" Shop
  // tự đặt cho từng trường, không cố định.
  visitorInfo?: Record<string, string>;
}
