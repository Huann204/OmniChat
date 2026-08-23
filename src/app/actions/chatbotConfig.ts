"use server";

import { ApiError, apiFetch } from "@/lib/api";
import { getCurrentShopId, getSessionToken } from "@/lib/session";
import type { ChatbotConfig } from "@/types/chatbotConfig";

async function authHeaders(token: string) {
  const shopId = await getCurrentShopId();
  return {
    Authorization: `Bearer ${token}`,
    ...(shopId ? { "X-Shop-Id": shopId } : {}),
  };
}

export interface ChatbotConfigInput {
  name?: string;
  instructions?: string;
  model?: string;
  autoReplyEnabled?: boolean;
}

type ChatbotConfigResult = { item: ChatbotConfig } | { error: string };

export async function createChatbotConfig(input: ChatbotConfigInput): Promise<ChatbotConfigResult> {
  const token = await getSessionToken();
  if (!token) return { error: "Chưa đăng nhập" };

  try {
    const data = await apiFetch<{ success: boolean; item: ChatbotConfig }>("/chatbot-configs", {
      method: "POST",
      headers: await authHeaders(token),
      body: JSON.stringify(input),
    });
    return { item: data.item };
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Không tạo được chatbot" };
  }
}

export async function updateChatbotConfig(
  id: string,
  input: ChatbotConfigInput
): Promise<ChatbotConfigResult> {
  const token = await getSessionToken();
  if (!token) return { error: "Chưa đăng nhập" };

  try {
    const data = await apiFetch<{ success: boolean; item: ChatbotConfig }>(`/chatbot-configs/${id}`, {
      method: "PATCH",
      headers: await authHeaders(token),
      body: JSON.stringify(input),
    });
    return { item: data.item };
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Không cập nhật được chatbot" };
  }
}

export interface ChatbotPreviewHistoryItem {
  role: "user" | "bot";
  text: string;
}

// Sinh câu trả lời THẬT cho 1 tin nhắn test — dùng cho khung Chat preview
// trong AiChatbotBuilder.tsx (tìm kiến thức liên quan + ghép Hướng dẫn của
// bot, gọi Gemini sinh câu trả lời, xem chatbotConfig.controller.ts). `history`
// = các tin nhắn TRƯỚC ĐÓ trong cùng lượt preview (không gồm `message`) —
// cần để tìm kiến thức đúng cho những câu trả lời cộc lốc kiểu "Hà nội đi"
// (chỉ có nghĩa khi biết bot vừa hỏi lại điều gì trước đó).
export async function previewChatbotReply(
  chatbotId: string,
  message: string,
  history: ChatbotPreviewHistoryItem[]
): Promise<{ reply: string } | { error: string }> {
  const token = await getSessionToken();
  if (!token) return { error: "Chưa đăng nhập" };

  try {
    const data = await apiFetch<{ success: boolean; reply: string }>(
      `/chatbot-configs/${chatbotId}/preview`,
      {
        method: "POST",
        headers: await authHeaders(token),
        body: JSON.stringify({ message, history }),
      }
    );
    return { reply: data.reply };
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Không sinh được câu trả lời" };
  }
}

// Page nào (thuộc Shop) đang gán bot này — dùng để tick sẵn đúng lựa chọn
// lúc mở modal "Chọn Page" (AssignChatbotPagesModal.tsx).
export async function getChatbotPages(chatbotId: string): Promise<string[]> {
  const token = await getSessionToken();
  if (!token) return [];

  try {
    const data = await apiFetch<{ success: boolean; pageIds: string[] }>(
      `/chatbot-configs/${chatbotId}/pages`,
      { headers: await authHeaders(token) }
    );
    return data.pageIds;
  } catch {
    return [];
  }
}

// Gán bot này cho ĐÚNG danh sách Page được chọn (thay thế toàn bộ lựa chọn
// cũ, không cộng dồn) — xem chatbotConfig.controller.ts#assignChatbotPages.
export async function assignChatbotPages(
  chatbotId: string,
  pageIds: string[]
): Promise<{ error?: string }> {
  const token = await getSessionToken();
  if (!token) return { error: "Chưa đăng nhập" };

  try {
    await apiFetch(`/chatbot-configs/${chatbotId}/pages`, {
      method: "PATCH",
      headers: await authHeaders(token),
      body: JSON.stringify({ pageIds }),
    });
    return {};
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Không gán được Page cho chatbot" };
  }
}

export async function deleteChatbotConfig(id: string): Promise<{ error?: string }> {
  const token = await getSessionToken();
  if (!token) return { error: "Chưa đăng nhập" };

  try {
    await apiFetch(`/chatbot-configs/${id}`, {
      method: "DELETE",
      headers: await authHeaders(token),
    });
    return {};
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Không xoá được chatbot" };
  }
}
