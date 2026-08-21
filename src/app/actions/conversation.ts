"use server";

import { ApiError, apiFetch } from "@/lib/api";
import { mapRawConversations, type RawConversation } from "@/lib/dal";
import { formatClock, messageKindAndContent } from "@/lib/message-format";
import { getCurrentShopId, getSessionToken } from "@/lib/session";
import type { Conversation, ConversationMessage } from "@/types/conversation";

async function authHeaders(token: string) {
  const shopId = await getCurrentShopId();
  return {
    Authorization: `Bearer ${token}`,
    ...(shopId ? { "X-Shop-Id": shopId } : {}),
  };
}

export async function markConversationRead(conversationId: string) {
  const token = await getSessionToken();
  if (!token) return;

  try {
    await apiFetch(`/conversations/${conversationId}/read`, {
      method: "PATCH",
      headers: await authHeaders(token),
    });
  } catch {
    // Không chặn UI nếu lưu trạng thái đọc thất bại — không quan trọng bằng
    // việc hiển thị tin nhắn.
  }
}

interface RawMessage {
  id: string;
  sender: "customer" | "page";
  text?: string;
  attachments?: { type: string; url: string; name?: string }[];
  senderName?: string;
  senderAvatarUrl?: string;
  replyPreviewText?: string;
  replyToMessageId?: string;
  reactionIcon?: string;
  createdAt: string;
}

function mapRawMessage(m: RawMessage): ConversationMessage {
  const { kind, text, attachmentUrls } = messageKindAndContent(m.text, m.attachments);
  return {
    id: m.id,
    sender: m.sender,
    kind,
    text,
    attachmentUrls,
    senderName: m.senderName,
    senderAvatarUrl: m.senderAvatarUrl,
    replyPreviewText: m.replyPreviewText,
    replyToMessageId: m.replyToMessageId,
    reactionIcon: m.reactionIcon,
    time: formatClock(m.createdAt),
    createdAt: m.createdAt,
  };
}

// Tải thêm tin nhắn cũ hơn khi client cuộn lên đầu khung chat — before/
// beforeId là cursor: createdAt + id của tin cũ nhất đang có ở client. Bỏ
// trống cả 2 (không truyền) để lấy đúng N tin MỚI NHẤT — dùng lúc vừa mở 1
// hội thoại chưa có sẵn tin nào ở client (VD: bấm "Nhắn tin" từ danh sách
// bạn bè Zalo, xem InboxView.tsx#handleOpenZaloConversation).
export async function getOlderMessages(
  conversationId: string,
  before?: string,
  beforeId?: string
): Promise<{ messages: ConversationMessage[]; hasMore: boolean }> {
  const token = await getSessionToken();
  if (!token) return { messages: [], hasMore: false };

  try {
    const params = new URLSearchParams();
    if (before && beforeId) {
      params.set("before", before);
      params.set("beforeId", beforeId);
    }
    const data = await apiFetch<{ success: boolean; hasMore: boolean; messages: RawMessage[] }>(
      `/conversations/${conversationId}/messages?${params.toString()}`,
      { headers: await authHeaders(token) }
    );

    return {
      hasMore: data.hasMore,
      messages: data.messages.map(mapRawMessage),
    };
  } catch {
    return { messages: [], hasMore: false };
  }
}

// Tải thêm hội thoại cũ hơn khi client cuộn xuống cuối danh sách /livechat —
// before/beforeId là cursor: lastMessageAt + id của hội thoại CUỐI CÙNG đang
// có ở client (mirror đúng cách getOlderMessages làm cho tin nhắn). Bỏ trống
// cả 2 (không truyền) để lấy lại đúng TRANG ĐẦU — dùng khi cần nạp lại danh
// sách từ đầu cho chắc (VD: xóa hết ô tìm kiếm, xem InboxView.tsx) thay vì tự
// ghép lại state đang có sẵn ở client.
export async function getMoreConversations(
  pageIds: string[],
  before?: string,
  beforeId?: string
): Promise<{ conversations: Conversation[]; hasMore: boolean }> {
  const token = await getSessionToken();
  if (!token || pageIds.length === 0) return { conversations: [], hasMore: false };

  try {
    const params = new URLSearchParams({ pageIds: pageIds.join(",") });
    if (before && beforeId) {
      params.set("before", before);
      params.set("beforeId", beforeId);
    }
    const data = await apiFetch<{
      success: boolean;
      hasMore: boolean;
      conversations: RawConversation[];
    }>(`/conversations?${params.toString()}`, { headers: await authHeaders(token) });

    return { conversations: mapRawConversations(data.conversations), hasMore: data.hasMore };
  } catch {
    return { conversations: [], hasMore: false };
  }
}

// Tìm hội thoại theo tên khách (debounce phía client sau khi ngừng gõ) — tìm
// xuyên suốt TOÀN BỘ hội thoại của các Page đang xem, không chỉ trong số đã
// tải sẵn ở client. Không phân trang tiếp (không before/beforeId) — chỉ lấy
// tối đa 1 trang kết quả.
export async function searchConversations(
  pageIds: string[],
  q: string
): Promise<{ conversations: Conversation[] }> {
  const token = await getSessionToken();
  if (!token || pageIds.length === 0 || !q.trim()) return { conversations: [] };

  try {
    const data = await apiFetch<{ success: boolean; conversations: RawConversation[] }>(
      `/conversations?pageIds=${encodeURIComponent(pageIds.join(","))}&q=${encodeURIComponent(q.trim())}`,
      { headers: await authHeaders(token) }
    );
    return { conversations: mapRawConversations(data.conversations) };
  } catch {
    return { conversations: [] };
  }
}

// Mỗi part là 1 tin nhắn riêng biệt sẽ gửi qua Facebook Send API — text HOẶC
// 1/nhiều ảnh (imageUrls gộp chung 1 tin nhắn, không tách thành nhiều tin).
// clientId là id tạm client tự sinh cho tin đang hiện optimistic — server
// echo lại đúng id đó qua socket để client đối chiếu, tránh hiện trùng khi
// tin thật dội về.
export interface SendMessagePart {
  clientId: string;
  text?: string;
  imageUrls?: string[];
  // File đính kèm bất kỳ (không phải ảnh) — đúng 1 file/phần, chọn từ
  // FilePickerModal (xem MessageComposer.tsx). isVideo quyết định server lưu
  // Message.attachments[].type là "video" hay "file" — để MessageThread.tsx
  // render đúng player thay vì chỉ hiện link tải chung chung.
  fileUrl?: string;
  fileName?: string;
  isVideo?: boolean;
  // Chỉ có ý nghĩa khi có `text` — id 1 tin nhắn của khách muốn "Trả lời
  // trích dẫn" (hiện chỉ Zalo hỗ trợ, xem MessageThread.tsx). Bỏ qua âm thầm
  // phía server nếu không đủ dữ liệu để trích dẫn.
  replyToMessageId?: string;
  // Sticker Zalo muốn gửi (chỉ Zalo hỗ trợ, xem ZaloStickerPickerModal.tsx) —
  // id/cateId/type khớp nguyên vẹn ZaloStickerItem từ app/actions/zaloFriend.ts.
  sticker?: { id: number; cateId: number; type: number };
}

export interface SendMessagePartResult {
  clientId: string;
  error?: string;
  // Dữ liệu THẬT của tin vừa gửi (id thật thay cho clientId tạm, và các
  // field chỉ server mới tính được như replyPreviewText) — dùng để đồng bộ
  // lại tin đang hiện optimistic, tránh phải F5 mới thấy đúng (khung trích
  // dẫn "Trả lời" là ví dụ điển hình, xem InboxView.tsx#handleSend).
  message?: ConversationMessage;
}

// Gửi 1 hoặc nhiều tin nhắn (text và/hoặc ảnh) trong cùng 1 lượt bấm gửi.
// Mỗi part được server xử lý độc lập — 1 phần lỗi không chặn các phần còn
// lại, nên trả về kết quả riêng cho từng clientId thay vì 1 lỗi chung.
export async function sendMessage(
  conversationId: string,
  parts: SendMessagePart[]
): Promise<{ results: SendMessagePartResult[] } | { error: string }> {
  const token = await getSessionToken();
  if (!token) return { error: "Chưa đăng nhập" };

  try {
    const data = await apiFetch<{
      success: boolean;
      results: { clientId: string; error?: string; message?: RawMessage }[];
    }>(`/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: await authHeaders(token),
      body: JSON.stringify({ parts }),
    });
    return {
      results: data.results.map((r) => ({
        clientId: r.clientId,
        error: r.error,
        message: r.message ? mapRawMessage(r.message) : undefined,
      })),
    };
  } catch (err) {
    return {
      error: err instanceof ApiError ? err.message : "Không gửi được tin nhắn",
    };
  }
}

// Thả (icon là 1 trong ZALO_REACTIONS phía server) hoặc gỡ (icon="NONE")
// reaction vào 1 tin nhắn của khách — hiện chỉ Zalo hỗ trợ, server tự báo
// lỗi rõ ràng nếu gọi cho hội thoại Facebook.
export async function reactToMessage(
  conversationId: string,
  messageId: string,
  icon: string
): Promise<{ reactionIcon?: string } | { error: string }> {
  const token = await getSessionToken();
  if (!token) return { error: "Chưa đăng nhập" };

  try {
    const data = await apiFetch<{ success: boolean; reactionIcon?: string }>(
      `/conversations/${conversationId}/messages/${messageId}/reaction`,
      { method: "PUT", headers: await authHeaders(token), body: JSON.stringify({ icon }) }
    );
    return { reactionIcon: data.reactionIcon };
  } catch (err) {
    return {
      error: err instanceof ApiError ? err.message : "Không thả được icon",
    };
  }
}
