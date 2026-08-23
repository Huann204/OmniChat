"use server";

import { ApiError, apiFetch } from "@/lib/api";
import { getCurrentShopId, getSessionToken } from "@/lib/session";
import type { KnowledgeEntry } from "@/types/knowledgeEntry";

async function authHeaders(token: string) {
  const shopId = await getCurrentShopId();
  return {
    Authorization: `Bearer ${token}`,
    ...(shopId ? { "X-Shop-Id": shopId } : {}),
  };
}

// Danh sách kiến thức của ĐÚNG 1 chatbot — gọi lại mỗi khi đổi bot đang chọn
// trong AiChatbotBuilder.tsx (không tải sẵn lúc vào trang, vì danh sách bot
// có thể nhiều và ít khi xem hết mọi bot trong 1 lượt).
export async function getKnowledgeEntries(chatbotId: string): Promise<KnowledgeEntry[]> {
  const token = await getSessionToken();
  if (!token) return [];

  try {
    const data = await apiFetch<{ success: boolean; items: KnowledgeEntry[] }>(
      `/knowledge-entries?chatbotId=${encodeURIComponent(chatbotId)}`,
      { headers: await authHeaders(token) }
    );
    return data.items;
  } catch {
    return [];
  }
}

type KnowledgeEntryResult = { item: KnowledgeEntry } | { error: string };

export async function createKnowledgeEntry(
  chatbotId: string,
  content: string
): Promise<KnowledgeEntryResult> {
  const token = await getSessionToken();
  if (!token) return { error: "Chưa đăng nhập" };

  try {
    const data = await apiFetch<{ success: boolean; item: KnowledgeEntry }>("/knowledge-entries", {
      method: "POST",
      headers: await authHeaders(token),
      body: JSON.stringify({ chatbotId, content }),
    });
    return { item: data.item };
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Không thêm được kiến thức" };
  }
}

export interface KnowledgeSearchResult {
  id: string;
  content: string;
  score: number;
}

// Tìm kiến thức liên quan tới 1 câu hỏi — dùng cho khung Chat preview trong
// AiChatbotBuilder.tsx để tự kiểm tra embedding tìm đúng không, TRƯỚC khi
// làm bước sinh câu trả lời thật bằng AI (chưa có, chỉ trả về đoạn thô).
export async function searchKnowledge(
  chatbotId: string,
  query: string
): Promise<{ results: KnowledgeSearchResult[] } | { error: string }> {
  const token = await getSessionToken();
  if (!token) return { error: "Chưa đăng nhập" };

  try {
    const data = await apiFetch<{ success: boolean; results: KnowledgeSearchResult[] }>(
      "/knowledge-entries/search",
      {
        method: "POST",
        headers: await authHeaders(token),
        body: JSON.stringify({ chatbotId, query }),
      }
    );
    return { results: data.results };
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Không tìm được kiến thức liên quan" };
  }
}

export async function deleteKnowledgeEntry(id: string): Promise<{ error?: string }> {
  const token = await getSessionToken();
  if (!token) return { error: "Chưa đăng nhập" };

  try {
    await apiFetch(`/knowledge-entries/${id}`, {
      method: "DELETE",
      headers: await authHeaders(token),
    });
    return {};
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Không xoá được kiến thức" };
  }
}
