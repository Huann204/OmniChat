"use server";

import { ApiError, apiFetch } from "@/lib/api";
import { getCurrentShopId, getSessionToken } from "@/lib/session";

// Ghi chú nội bộ Shop cho 1 hội thoại — CHỈ nhân viên thấy, không liên
// quan/không gửi cho khách. Danh sách nhiều ghi chú (khác 1 ô duy nhất) —
// mỗi ghi chú có tác giả, thời gian, sửa/xoá/ghim được riêng từng cái.
export interface ConversationNoteItem {
  id: string;
  text: string;
  pinned: boolean;
  authorName: string;
  authorAvatarUrl?: string;
  createdAt: string;
}

async function authHeaders(token: string) {
  const shopId = await getCurrentShopId();
  return {
    Authorization: `Bearer ${token}`,
    ...(shopId ? { "X-Shop-Id": shopId } : {}),
  };
}

export async function listConversationNotes(conversationId: string): Promise<ConversationNoteItem[]> {
  const token = await getSessionToken();
  if (!token) return [];

  try {
    const data = await apiFetch<{ success: boolean; items: ConversationNoteItem[] }>(
      `/conversations/${conversationId}/notes`,
      { headers: await authHeaders(token) }
    );
    return data.items;
  } catch {
    return [];
  }
}

export async function createConversationNote(
  conversationId: string,
  text: string
): Promise<{ item?: ConversationNoteItem; error?: string }> {
  const token = await getSessionToken();
  if (!token) return { error: "Chưa đăng nhập" };

  try {
    const data = await apiFetch<{ success: boolean; item: ConversationNoteItem }>(
      `/conversations/${conversationId}/notes`,
      { method: "POST", headers: await authHeaders(token), body: JSON.stringify({ text }) }
    );
    return { item: data.item };
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Không thêm được ghi chú" };
  }
}

export async function updateConversationNote(
  conversationId: string,
  noteId: string,
  input: { text?: string; pinned?: boolean }
): Promise<{ item?: ConversationNoteItem; error?: string }> {
  const token = await getSessionToken();
  if (!token) return { error: "Chưa đăng nhập" };

  try {
    const data = await apiFetch<{ success: boolean; item: ConversationNoteItem }>(
      `/conversations/${conversationId}/notes/${noteId}`,
      { method: "PATCH", headers: await authHeaders(token), body: JSON.stringify(input) }
    );
    return { item: data.item };
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Không cập nhật được ghi chú" };
  }
}

export async function deleteConversationNote(
  conversationId: string,
  noteId: string
): Promise<{ error?: string }> {
  const token = await getSessionToken();
  if (!token) return { error: "Chưa đăng nhập" };

  try {
    await apiFetch(`/conversations/${conversationId}/notes/${noteId}`, {
      method: "DELETE",
      headers: await authHeaders(token),
    });
    return {};
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Không xoá được ghi chú" };
  }
}
