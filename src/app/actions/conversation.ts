"use server";

import { apiFetch } from "@/lib/api";
import { getSessionToken } from "@/lib/session";

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
