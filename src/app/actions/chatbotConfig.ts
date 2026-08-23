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
