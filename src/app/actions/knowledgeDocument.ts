"use server";

import { ApiError, apiFetch } from "@/lib/api";
import { getCurrentShopId, getSessionToken } from "@/lib/session";
import type { KnowledgeDocument } from "@/types/knowledgeDocument";

async function authHeaders(token: string) {
  const shopId = await getCurrentShopId();
  return {
    Authorization: `Bearer ${token}`,
    ...(shopId ? { "X-Shop-Id": shopId } : {}),
  };
}

// Danh sách tài liệu đã upload của ĐÚNG 1 chatbot — tách khỏi
// getKnowledgeEntries (mục nhập tay) vì hiện trong 1 khối "Tài liệu" riêng
// trong AiChatbotBuilder.tsx. Việc upload thật sự đi qua
// app/api/knowledge-documents (Route Handler, không phải Server Action) vì
// cần gửi multipart/form-data vượt giới hạn 1MB body của Server Action.
export async function getKnowledgeDocuments(chatbotId: string): Promise<KnowledgeDocument[]> {
  const token = await getSessionToken();
  if (!token) return [];

  try {
    const data = await apiFetch<{ success: boolean; items: KnowledgeDocument[] }>(
      `/knowledge-documents?chatbotId=${encodeURIComponent(chatbotId)}`,
      { headers: await authHeaders(token) }
    );
    return data.items;
  } catch {
    return [];
  }
}

type KnowledgeDocumentResult = { item: KnowledgeDocument } | { error: string };

// Tạo kiến thức từ 1 file ĐÃ CÓ SẴN trong thư viện "Tệp và video" (chọn qua
// FilePickerModal, xem AiChatbotBuilder.tsx) — không còn upload trực tiếp ở
// đây, nên đây là Server Action JSON thường (không cần Route Handler
// multipart như trước, body chỉ có 2 id, không có file).
export async function createKnowledgeDocumentFromMedia(
  chatbotId: string,
  mediaId: string
): Promise<KnowledgeDocumentResult> {
  const token = await getSessionToken();
  if (!token) return { error: "Chưa đăng nhập" };

  try {
    const data = await apiFetch<{ success: boolean; item: KnowledgeDocument }>("/knowledge-documents", {
      method: "POST",
      headers: await authHeaders(token),
      body: JSON.stringify({ chatbotId, mediaId }),
    });
    return { item: data.item };
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Không thêm được tài liệu này" };
  }
}

export async function deleteKnowledgeDocument(id: string): Promise<{ error?: string }> {
  const token = await getSessionToken();
  if (!token) return { error: "Chưa đăng nhập" };

  try {
    await apiFetch(`/knowledge-documents/${id}`, {
      method: "DELETE",
      headers: await authHeaders(token),
    });
    return {};
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Không xoá được tài liệu" };
  }
}
