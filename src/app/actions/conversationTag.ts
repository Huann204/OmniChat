"use server";

import { ApiError, apiFetch } from "@/lib/api";
import { getCurrentShopId, getSessionToken } from "@/lib/session";
import type { ConversationTag } from "@/types/conversationTag";

async function authHeaders(token: string) {
  const shopId = await getCurrentShopId();
  return {
    Authorization: `Bearer ${token}`,
    ...(shopId ? { "X-Shop-Id": shopId } : {}),
  };
}

export interface ConversationTagInput {
  label: string;
  color: string;
}

type ConversationTagResult = { item: ConversationTag } | { error: string };

export async function createConversationTag(
  input: ConversationTagInput
): Promise<ConversationTagResult> {
  const token = await getSessionToken();
  if (!token) return { error: "Chưa đăng nhập" };

  try {
    const data = await apiFetch<{ success: boolean; item: ConversationTag }>(
      "/conversation-tags",
      { method: "POST", headers: await authHeaders(token), body: JSON.stringify(input) }
    );
    return { item: data.item };
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Không tạo được thẻ" };
  }
}

export async function updateConversationTag(
  id: string,
  input: ConversationTagInput
): Promise<ConversationTagResult> {
  const token = await getSessionToken();
  if (!token) return { error: "Chưa đăng nhập" };

  try {
    const data = await apiFetch<{ success: boolean; item: ConversationTag }>(
      `/conversation-tags/${id}`,
      { method: "PATCH", headers: await authHeaders(token), body: JSON.stringify(input) }
    );
    return { item: data.item };
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Không cập nhật được thẻ" };
  }
}

export async function deleteConversationTag(id: string): Promise<{ error?: string }> {
  const token = await getSessionToken();
  if (!token) return { error: "Chưa đăng nhập" };

  try {
    await apiFetch(`/conversation-tags/${id}`, {
      method: "DELETE",
      headers: await authHeaders(token),
    });
    return {};
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Không xoá được thẻ" };
  }
}

// Gán lại toàn bộ danh sách thẻ của 1 hội thoại — dùng khi bấm bật/tắt 1 thẻ
// trong QuickTagBar (client tự tính mảng mới rồi gửi nguyên mảng lên).
export async function setConversationTags(
  conversationId: string,
  tagIds: string[]
): Promise<{ tags: ConversationTag[] } | { error: string }> {
  const token = await getSessionToken();
  if (!token) return { error: "Chưa đăng nhập" };

  try {
    const data = await apiFetch<{ success: boolean; tags: ConversationTag[] }>(
      `/conversations/${conversationId}/tags`,
      { method: "PUT", headers: await authHeaders(token), body: JSON.stringify({ tagIds }) }
    );
    return { tags: data.tags };
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Không cập nhật được thẻ hội thoại" };
  }
}
