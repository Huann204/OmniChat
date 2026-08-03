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
        const { kind, text, attachmentUrl } = messageKindAndContent(m.text, m.attachments);
        return {
          id: m.id,
          sender: m.sender,
          kind,
          text,
          attachmentUrl,
          time: formatClock(m.createdAt),
          createdAt: m.createdAt,
        };
      }),
    };
  } catch {
    return { messages: [], hasMore: false };
  }
}

// Gửi tin nhắn văn bản trả lời khách qua Facebook. clientId là id tạm client
// tự sinh cho tin đang hiện optimistic — server echo lại đúng id đó qua
// socket để client đối chiếu, tránh hiện trùng khi tin thật dội về.
export async function sendMessage(
  conversationId: string,
  text: string,
  clientId: string
): Promise<{ error?: string }> {
  const token = await getSessionToken();
  if (!token) return { error: "Chưa đăng nhập" };

  try {
    await apiFetch(`/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ text, clientId }),
    });
    return {};
  } catch (err) {
    return {
      error: err instanceof ApiError ? err.message : "Không gửi được tin nhắn",
    };
  }
}
