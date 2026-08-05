import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { apiFetch } from "./api";
import { getCachedUser, getSessionToken } from "./session";
import type { Bot } from "@/types/bot";
import type { Conversation, MessageKind } from "@/types/conversation";

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

interface ConnectedPageRaw {
  id: string;
  type: number;
  pageId: string;
  name: string;
  category?: string;
  picture?: string;
  active: boolean;
}

// Chỉ có Facebook (type = 0) hiện tại — map sang Bot để dùng chung UI, sẵn
// sàng mở rộng khi có nguồn dữ liệu bot thật cho các kênh khác.
export const getConnectedPages = cache(async (): Promise<Bot[]> => {
  const token = await getSessionToken();
  if (!token) return [];

  try {
    const data = await apiFetch<{ success: boolean; pages: ConnectedPageRaw[] }>(
      "/facebook/pages/connected",
      { headers: { Authorization: `Bearer ${token}` } }
    );

    return data.pages.map((p) => ({
      id: p.id,
      pageId: p.pageId,
      name: p.name,
      channel: "facebook" as const,
      profileUrl: `https://facebook.com/${p.pageId}`,
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
  createdAt: string;
}

interface RawConversation {
  id: string;
  pageId: string;
  customerName?: string;
  customerAvatarUrl?: string;
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
      text: kind === "image" || kind === "sticker" ? undefined : ATTACHMENT_LABELS[first.type] ?? "[Tệp đính kèm]",
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
    customerName: c.customerName || "Khách hàng",
    customerAvatarUrl: c.customerAvatarUrl,
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
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return mapRawConversations(data.conversations);
    } catch {
      return [];
    }
  }
);
