import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { apiFetch } from "./api";
import { formatClock, formatTimeLabel, messageKindAndContent } from "./message-format";
import { getCurrentShopId, getSessionToken } from "./session";
import type { AiAssistantSettings } from "@/types/aiAssistant";
import type { Bot } from "@/types/bot";
import type { ChatbotConfig } from "@/types/chatbotConfig";
import type { Conversation } from "@/types/conversation";
import type { ConversationTag } from "@/types/conversationTag";
import type { PostItem, PostStatus } from "@/app/actions/post";
import type { QuickReply } from "@/types/quickReply";
import type { ShopMember } from "@/types/shopMember";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  // Chỉ dùng để quyết định có hiện UI "đổi vào Shop khách để hỗ trợ" hay
  // không — quyền thật luôn được BE kiểm tra lại, xem shop.controller.ts#listAllShops.
  isSupportAdmin?: boolean;
}

// Luôn gọi /auth/me lấy dữ liệu mới nhất — trước đây có cache riêng ở cookie
// user_info để đỡ query Mongo mỗi lần chuyển trang, nhưng cache đó không tự
// biết khi nào phiên đăng nhập bị coi là không hợp lệ (vd refresh token bị
// thu hồi vì đổi mật khẩu ở thiết bị khác), nên có lúc hiện "vẫn đăng nhập"
// dù phiên đã chết hẳn. `cache()` của React vẫn tự gộp nhiều lần gọi trong
// CÙNG 1 lượt render (không gọi lặp lại /auth/me nhiều lần/1 trang), chỉ mất
// cache được XUYÊN SUỐT nhiều lượt điều hướng như trước.
export const getUser = cache(async (): Promise<SessionUser | null> => {
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

// Vai trò của CHÍNH MÌNH trong Shop đang active — quyết định trang Nhân sự
// có hiện nút thêm/đổi vai trò/xoá hay không (chỉ owner/admin thêm-xoá được,
// chỉ owner đổi vai trò được — khớp requireShopRole ở shop.routes.ts).
export const getCurrentShopRole = cache(async (): Promise<ShopSummary["role"] | null> => {
  const token = await getSessionToken();
  const shopId = await getCurrentShopId();
  if (!token || !shopId) return null;

  try {
    const data = await apiFetch<{ success: boolean; role: ShopSummary["role"] }>(
      "/shops/current",
      { headers: { Authorization: `Bearer ${token}`, ...(await shopHeader()) } }
    );
    return data.role;
  } catch {
    return null;
  }
});

// Danh sách nhân viên (thành viên) của Shop đang active — trang /settings/permissions.
export const getShopMembers = cache(async (): Promise<ShopMember[]> => {
  const token = await getSessionToken();
  const shopId = await getCurrentShopId();
  if (!token || !shopId) return [];

  try {
    const data = await apiFetch<{ success: boolean; members: ShopMember[] }>(
      `/shops/${shopId}/members`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return data.members;
  } catch {
    return [];
  }
});

interface ConnectedPageRaw {
  id: string;
  type: number;
  pageId: string;
  name: string;
  category?: string;
  picture?: string;
  status: Bot["status"];
}

// Khớp CHANNEL_TYPE_* trong server/src/models/connectedPage.model.ts — không
// có package dùng chung giữa 2 repo nên phải giữ đồng bộ thủ công.
const CHANNEL_TYPE_FACEBOOK = 0;
const CHANNEL_TYPE_ZALO_PERSONAL = 1;
const CHANNEL_TYPE_TELEGRAM = 2;

function channelFromType(type: number): Bot["channel"] {
  if (type === CHANNEL_TYPE_TELEGRAM) return "telegram";
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
      status: p.status,
      messageCount: 0,
      orderCount: 0,
      avatarUrl: p.picture,
    }));
  } catch {
    return [];
  }
});

// Không dùng cache() — trang Bài viết cần dữ liệu mới nhất mỗi lần vào (vừa
// tạo/xoá bài xong quay lại danh sách), khác getConnectedPages (Page ít đổi,
// cache trong 1 lượt render là hợp lý).
export async function getPosts(status?: PostStatus): Promise<PostItem[]> {
  const token = await getSessionToken();
  if (!token) return [];

  try {
    const query = status ? `?status=${status}` : "";
    const data = await apiFetch<{ success: boolean; posts: PostItem[] }>(`/posts${query}`, {
      headers: { Authorization: `Bearer ${token}`, ...(await shopHeader()) },
    });
    return data.posts;
  } catch {
    return [];
  }
}

interface RawMessage {
  id: string;
  sender: "customer" | "page";
  text?: string;
  attachments?: { type: string; url: string; name?: string; description?: string; thumb?: string }[];
  senderName?: string;
  senderAvatarUrl?: string;
  replyPreviewText?: string;
  replyToMessageId?: string;
  reactionIcon?: string;
  mentions?: { uid: string; pos: number; len: number }[];
  createdAt: string;
}

// Export để actions/conversation.ts tái dùng cho getMoreConversations —
// tránh lặp lại logic map (đã có bài học trước đây khi dal.ts/message-format.ts
// từng có 2 bản implement lệch nhau, xem messageKindAndContent).
export interface RawConversation {
  id: string;
  pageId: string;
  type: number;
  customerName?: string;
  customerAvatarUrl?: string;
  isGroup?: boolean;
  lastMessageAt: string;
  isRead: boolean;
  tags: ConversationTag[];
  hasMoreMessages: boolean;
  messages: RawMessage[];
}

export function mapRawConversations(raw: RawConversation[]): Conversation[] {
  return raw.map((c) => ({
    id: c.id,
    pageId: c.pageId,
    type: c.type,
    customerName: c.customerName || "Khách hàng",
    customerAvatarUrl: c.customerAvatarUrl,
    isGroup: c.isGroup,
    tags: c.tags,
    lastSeenLabel: "",
    timeLabel: formatTimeLabel(c.lastMessageAt),
    lastMessageAt: c.lastMessageAt,
    isRead: c.isRead,
    hasMoreMessages: c.hasMoreMessages,
    messages: c.messages.map((m) => {
      const { kind, text, attachmentUrls, linkPreview } = messageKindAndContent(m.text, m.attachments);
      return {
        id: m.id,
        sender: m.sender,
        kind,
        text,
        attachmentUrls,
        linkPreview,
        senderName: m.senderName,
        senderAvatarUrl: m.senderAvatarUrl,
        replyPreviewText: m.replyPreviewText,
        replyToMessageId: m.replyToMessageId,
        reactionIcon: m.reactionIcon,
        mentions: m.mentions,
        time: formatClock(m.createdAt),
        createdAt: m.createdAt,
      };
    }),
  }));
}

// Lấy hội thoại + tin nhắn của 1 hoặc nhiều Page cùng lúc (xem gộp tạm thời)
// — dồn chung vào 1 danh sách, không lưu lại việc gộp này ở đâu cả. Chỉ tải
// TRANG ĐẦU (CONVERSATION_LIST_PAGE_SIZE hội thoại mới nhất) — cuộn xuống
// cuối danh sách tải thêm qua getMoreConversations (actions/conversation.ts).
export const getConversationsForPages = cache(
  async (pageIds: string[]): Promise<{ conversations: Conversation[]; hasMore: boolean }> => {
    const token = await getSessionToken();
    if (!token || pageIds.length === 0) return { conversations: [], hasMore: false };

    try {
      const data = await apiFetch<{
        success: boolean;
        hasMore: boolean;
        conversations: RawConversation[];
      }>(`/conversations?pageIds=${encodeURIComponent(pageIds.join(","))}`, {
        headers: { Authorization: `Bearer ${token}`, ...(await shopHeader()) },
      });
      return { conversations: mapRawConversations(data.conversations), hasMore: data.hasMore };
    } catch {
      return { conversations: [], hasMore: false };
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

// Danh sách chatbot tự động của Shop (mỗi bot: tên/hướng dẫn/model riêng) —
// xem AiChatbotBuilder.tsx. Rỗng = Shop chưa tạo bot nào, FE tự tạo 1 bot
// mặc định khi vào trang.
export const getChatbotConfigs = cache(async (): Promise<ChatbotConfig[]> => {
  const token = await getSessionToken();
  if (!token) return [];

  try {
    const data = await apiFetch<{ success: boolean; items: ChatbotConfig[] }>("/chatbot-configs", {
      headers: { Authorization: `Bearer ${token}`, ...(await shopHeader()) },
    });
    return data.items;
  } catch {
    return [];
  }
});

// Danh mục thẻ hội thoại của Shop đang active — dùng cả ở trang Cài đặt
// (quản lý) lẫn Livechat (QuickTagBar, gắn/gỡ thẻ cho 1 hội thoại).
export const getConversationTags = cache(async (): Promise<ConversationTag[]> => {
  const token = await getSessionToken();
  if (!token) return [];

  try {
    const data = await apiFetch<{ success: boolean; items: ConversationTag[] }>(
      "/conversation-tags",
      { headers: { Authorization: `Bearer ${token}`, ...(await shopHeader()) } }
    );
    return data.items;
  } catch {
    return [];
  }
});

// Chỉ dùng khi chưa đăng nhập hoặc API lỗi (xem catch bên dưới) — nội dung
// khớp DEFAULT_PRESET_CONTENT phía server (aiAssistant.controller.ts) để
// nhất quán, dù nhánh này hiếm khi thật sự hiện ra (suggestReplyEnabled
// false nên AiSuggestionBar không tự gọi sinh gợi ý).
const DEFAULT_AI_ASSISTANT_SETTINGS: AiAssistantSettings = {
  suggestReplyEnabled: false,
  suggestReplyTrigger: "on_open",
  presets: [
    { label: "Câu 1", enabled: false, content: "- Xưng em gọi bác\n- Luôn chào\n- Luôn cảm ơn" },
    { label: "Câu 2", enabled: false, content: "Sử dụng tone formal cho phong cách nghiêm túc" },
    {
      label: "Câu 3",
      enabled: false,
      content: "Sử dụng tone friendly cho phong cách thân thiện. Thêm emoji vào câu trả lời",
    },
  ],
};

// Cấu hình "Gợi ý trả lời tin nhắn từ AI" của Shop đang active — dùng ở cả
// trang Cài đặt (/settings/ai-assistant) lẫn Livechat (quyết định có tự gọi
// sinh gợi ý khi mở hội thoại hay không, xem InboxView).
export const getAiAssistantSettings = cache(async (): Promise<AiAssistantSettings> => {
  const token = await getSessionToken();
  if (!token) return DEFAULT_AI_ASSISTANT_SETTINGS;

  try {
    const data = await apiFetch<{ success: boolean; settings: AiAssistantSettings }>(
      "/ai-assistant/settings",
      { headers: { Authorization: `Bearer ${token}`, ...(await shopHeader()) } }
    );
    return data.settings;
  } catch {
    return DEFAULT_AI_ASSISTANT_SETTINGS;
  }
});
