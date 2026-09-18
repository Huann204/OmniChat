// Kiểu dữ liệu + hằng số cho form "trước khi chat" của widget Website — tách
// riêng khỏi app/actions/facebook.ts vì file đó có "use server", chỉ được
// export async function (không export được const/type ở runtime).

// Bộ trường CỐ ĐỊNH — khớp PRE_CHAT_FIELD_KEYS ở server
// (connectedPage.model.ts), không cho Shop tự thêm trường tuỳ ý.
export type PreChatFieldKey = "name" | "email" | "phone" | "city";

export interface PreChatField {
  key: PreChatFieldKey;
  variable: string;
  required: boolean;
  visible: boolean;
}

// Link/số liên hệ nhanh hiện ở màn hình đầu tiên khi khách mở khung chat
// (TRƯỚC cả form trước khi chat) — bấm là chuyển thẳng sang kênh đó
// (Messenger, Zalo, gọi điện), không liên quan Conversation/Inbox. Field nào
// rỗng/không cấu hình -> widget.js không hiện nút đó.
export interface ContactChannels {
  facebook?: string;
  zalo?: string;
  phone?: string;
}

export interface WebsiteWidgetConfig {
  primaryColor?: string;
  greeting?: string;
  position?: "left" | "right";
  preChatFields?: PreChatField[];
  contactChannels?: ContactChannels;
}

// Nhãn tiếng Việt cố định cho từng field key — dùng chung cho
// EditWebsiteWidgetModal.tsx (bảng cấu hình) và WidgetPreview.tsx (xem
// trước). widget.js (app/widget.js/route.ts, chuỗi JS thuần nhúng ngoài) giữ
// bản riêng của nó, không import chung được.
export const PRE_CHAT_FIELD_LABELS: Record<PreChatFieldKey, string> = {
  name: "Tên bạn",
  email: "Email",
  phone: "Số điện thoại",
  city: "Tỉnh/Thành",
};

// Gợi ý mặc định khi Shop CHƯA từng cấu hình form trước khi chat — khớp bộ
// mặc định hiển thị trong UI tham khảo Shop gửi (3 trường bắt buộc + hiện,
// Tỉnh/Thành ẩn). Chỉ có tác dụng ở FE lúc chưa lưu gì — server chỉ thật sự
// bật form khi Shop bấm "Lưu thay đổi" ít nhất 1 lần (xem
// EditWebsiteWidgetModal.tsx).
export const DEFAULT_PRE_CHAT_FIELDS: PreChatField[] = [
  { key: "name", variable: "full_name", required: true, visible: true },
  { key: "email", variable: "email", required: true, visible: true },
  { key: "phone", variable: "phone", required: true, visible: true },
  { key: "city", variable: "city", required: false, visible: false },
];

export const EMPTY_CONTACT_CHANNELS: ContactChannels = { facebook: "", zalo: "", phone: "" };
