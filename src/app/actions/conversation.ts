"use server";

import { ApiError, apiFetch } from "@/lib/api";
import { formatClock, messageKindAndContent } from "@/lib/message-format";
import { getSessionToken } from "@/lib/session";
import type { ConversationMessage } from "@/types/conversation";

export async function markConversationRead(conversationId: string) {
  const token = await getSessionToken();
  if (!token) return;

  try {
    await apiFetch(`/conversations/${conversationId}/read`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
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
  attachments?: { type: string; url: string }[];
  createdAt: string;
}

// Tải thêm tin nhắn cũ hơn khi client cuộn lên đầu khung chat — before/
// beforeId là cursor: createdAt + id của tin cũ nhất đang có ở client.
export async function getOlderMessages(
  conversationId: string,
  before: string,
  beforeId: string
): Promise<{ messages: ConversationMessage[]; hasMore: boolean }> {
  const token = await getSessionToken();
  if (!token) return { messages: [], hasMore: false };

  try {
    const data = await apiFetch<{ success: boolean; hasMore: boolean; messages: RawMessage[] }>(
      `/conversations/${conversationId}/messages?before=${encodeURIComponent(before)}&beforeId=${encodeURIComponent(beforeId)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    return {
      hasMore: data.hasMore,
      messages: data.messages.map((m) => {
        const { kind, text, attachmentUrls } = messageKindAndContent(m.text, m.attachments);
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
    };
  } catch {
    return { messages: [], hasMore: false };
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
}

export interface SendMessagePartResult {
  clientId: string;
  error?: string;
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
      results: SendMessagePartResult[];
    }>(`/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ parts }),
    });
    return { results: data.results };
  } catch (err) {
    return {
      error: err instanceof ApiError ? err.message : "Không gửi được tin nhắn",
    };
  }
}
