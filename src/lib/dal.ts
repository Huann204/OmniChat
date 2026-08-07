import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { apiFetch } from "./api";
import { getCachedUser, getCurrentShopId, getSessionToken } from "./session";
import type { Bot } from "@/types/bot";
import type { Conversation, MessageKind } from "@/types/conversation";
import type { QuickReply } from "@/types/quickReply";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
}

// Ưu tiên đọc từ cookie user_info (ghi lúc login/register, xem session.ts)
// — tránh gọi /auth/me (tức query Mongo qua protect middleware) mỗi lần
// chuyển trang. Chỉ gọi /auth/me khi chưa có cache (phiên cũ từ trước khi
// có cơ chế này, hoặc cookie bị xoá) — các API khác vẫn tự xác thực JWT
// riêng nên bỏ qua bước gọi /auth/me ở đây không làm giảm bảo mật.
export const getUser = cache(async (): Promise<SessionUser | null> => {
  const cached = await getCachedUser();
  if (cached) return cached;

  const token = await getSessionToken();
  if (!token) return null;

  try {
    const data = await apiFetch<{ success: boolean; user: SessionUser }>(
      "/auth/me",
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return data.user;
  } catch {
    return null;
  }
});

export const verifySession = cache(async (): Promise<SessionUser> => {
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }
  return user;
});

export interface ShopSummary {
  id: string;
  name: string;
  role: "owner" | "admin" | "member";
}

export const getMyShops = cache(async (): Promise<ShopSummary[]> => {
  const token = await getSessionToken();
  if (!token) return [];

  try {
    const data = await apiFetch<{ success: boolean; shops: ShopSummary[] }>(
      "/shops/mine",
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return data.shops;
  } catch {
    return [];
  }
});

// Gộp vào headers của call cần Shop đang active — chỉ Next.js server gọi
// thẳng Express nên header này an toàn để đính kèm ở đây (không phải client
// browser tự set).
async function shopHeader(): Promise<Record<string, string>> {
  const shopId = await getCurrentShopId();
  return shopId ? { "X-Shop-Id": shopId } : {};
}

interface ConnectedPageRaw {
  id: string;
  type: number;
  pageId: string;
  name: string;
  category?: string;
  picture?: string;
  active: boolean;
}

// Khớp CHANNEL_TYPE_* trong server/src/models/connectedPage.model.ts — không
// có package dùng chung giữa 2 repo nên phải giữ đồng bộ thủ công.
const CHANNEL_TYPE_FACEBOOK = 0;
const CHANNEL_TYPE_ZALO_PERSONAL = 1;

function channelFromType(type: number): Bot["channel"] {
  if (type === CHANNEL_TYPE_ZALO_PERSONAL) return "zalo";
  if (type === CHANNEL_TYPE_FACEBOOK) return "facebook";
  return "facebook";
}

// Endpoint tên "/facebook/..." nhưng thực chất trả về mọi Page đã kết nối
// của Shop hiện tại bất kể kênh nào (xem facebook.controller.ts#listConnectedPages)
// — map sang Bot để dùng chung 1 UI dashboard cho mọi kênh.
export const getConnectedPages = cache(async (): Promise<Bot[]> => {
  const token = await getSessionToken();
  if (!token) return [];

  try {
    const data = await apiFetch<{ success: boolean; pages: ConnectedPageRaw[] }>(
      "/facebook/pages/connected",
      { headers: { Authorization: `Bearer ${token}`, ...(await shopHeader()) } }
    );

    return data.pages.map((p) => ({
      id: p.id,
      pageId: p.pageId,
      name: p.name,
      channel: channelFromType(p.type),
      profileUrl: p.type === CHANNEL_TYPE_FACEBOOK ? `https://facebook.com/${p.pageId}` : "",
      isActive: p.active,
      messageCount: 0,
      orderCount: 0,
      avatarUrl: p.picture,
    }));
  } catch {
    return [];
  }
});

interface RawMessage {
  id: string;
  sender: "customer" | "page";
  text?: string;
  attachments?: { type: string; url: string }[];
  senderName?: string;
  senderAvatarUrl?: string;
  createdAt: string;
}

interface RawConversation {
  id: string;
  pageId: string;
  type: number;
  customerName?: string;
  customerAvatarUrl?: string;
  isGroup?: boolean;
  lastMessageAt: string;
  isRead: boolean;
  hasMoreMessages: boolean;
  messages: RawMessage[];
}

const ATTACHMENT_LABELS: Record<string, string> = {
  sticker: "[Nhãn dán]",
  image: "[Hình ảnh]",
  video: "[Video]",
  audio: "[Tin nhắn thoại]",
  file: "[Tệp đính kèm]",
};

function messagePreviewText(msg: RawMessage): string | undefined {
  if (msg.text) return msg.text;
  const first = msg.attachments?.[0];
  if (first) return ATTACHMENT_LABELS[first.type] ?? "[Tệp đính kèm]";
  return undefined;
}

// Dùng để render TRONG khung chat — khác với messagePreviewText (chỉ dùng
// làm dòng preview cuối trong danh sách hội thoại). Ảnh/nhãn dán phải giữ
// nguyên URL để hiển thị thật, không collapse về text.
const ATTACHMENT_KIND: Record<string, MessageKind> = {
  sticker: "sticker",
  image: "image",
  video: "video",
};

function messageKindAndContent(
  msg: RawMessage
): { kind: MessageKind; text?: string; attachmentUrls?: string[] } {
  const first = msg.attachments?.[0];
  if (first) {
    const kind = ATTACHMENT_KIND[first.type] ?? "file";
    // Ảnh có thể nhiều cái gộp chung 1 tin nhắn (message.attachments dạng
    // mảng) — gom hết url ảnh lại để hiện chung 1 bong bóng. Sticker/video/
    // file luôn chỉ có đúng 1 attachment.
    const urls =
      kind === "image"
        ? (msg.attachments ?? []).filter((a) => a.type === "image").map((a) => a.url)
        : [first.url];
    return {
      kind,
      attachmentUrls: urls,
      // Ảnh/sticker có thể kèm chú thích (gõ chữ + gửi ảnh cùng 1 tin) —
      // giữ lại text thật của tin nhắn nếu có.
      text: kind === "image" || kind === "sticker" ? msg.text || undefined : ATTACHMENT_LABELS[first.type] ?? "[Tệp đính kèm]",
    };
  }
  return { kind: "text", text: msg.text };
}

const APP_TIME_ZONE = "Asia/Ho_Chi_Minh";

function formatClock(iso: string): string {
  return new Date(iso).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: APP_TIME_ZONE,
  });
}

function dateKey(date: Date): string {
  return date.toLocaleDateString("en-CA", { timeZone: APP_TIME_ZONE });
}

function formatTimeLabel(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  if (dateKey(date) === dateKey(now)) return formatClock(iso);

  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  if (dateKey(date) === dateKey(yesterday)) return "Hôm qua";

  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    timeZone: APP_TIME_ZONE,
  });
}

function mapRawConversations(raw: RawConversation[]): Conversation[] {
  return raw.map((c) => ({
    id: c.id,
    pageId: c.pageId,
    type: c.type,
    customerName: c.customerName || "Khách hàng",
    customerAvatarUrl: c.customerAvatarUrl,
    isGroup: c.isGroup,
    lastSeenLabel: "",
    timeLabel: formatTimeLabel(c.lastMessageAt),
    isRead: c.isRead,
    hasMoreMessages: c.hasMoreMessages,
    messages: c.messages.map((m) => {
      const { kind, text, attachmentUrls } = messageKindAndContent(m);
      return {
        id: m.id,
        sender: m.sender,
        kind,
        text,
        attachmentUrls,
        senderName: m.senderName,
        senderAvatarUrl: m.senderAvatarUrl,
        time: formatClock(m.createdAt),
        createdAt: m.createdAt,
      };
    }),
  }));
}

// Lấy hội thoại + tin nhắn của 1 hoặc nhiều Page cùng lúc (xem gộp tạm thời)
// — dồn chung vào 1 danh sách, không lưu lại việc gộp này ở đâu cả.
export const getConversationsForPages = cache(
  async (pageIds: string[]): Promise<Conversation[]> => {
    const token = await getSessionToken();
    if (!token || pageIds.length === 0) return [];

    try {
      const data = await apiFetch<{ success: boolean; conversations: RawConversation[] }>(
        `/conversations?pageIds=${encodeURIComponent(pageIds.join(","))}`,
        { headers: { Authorization: `Bearer ${token}`, ...(await shopHeader()) } }
      );
      return mapRawConversations(data.conversations);
    } catch {
      return [];
    }
  }
);

// Mẫu trả lời nhanh của Shop đang active — dùng cả ở trang Cài đặt (quản lý)
// lẫn Livechat (gõ ký tự tắt trong khung soạn tin, xem MessageComposer).
export const getQuickReplies = cache(async (): Promise<QuickReply[]> => {
  const token = await getSessionToken();
  if (!token) return [];

  try {
    const data = await apiFetch<{ success: boolean; items: QuickReply[] }>("/quick-replies", {
      headers: { Authorization: `Bearer ${token}`, ...(await shopHeader()) },
    });
    return data.items;
  } catch {
    return [];
  }
});
