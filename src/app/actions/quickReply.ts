"use server";

import { ApiError, apiFetch } from "@/lib/api";
import { getCurrentShopId, getSessionToken } from "@/lib/session";
import type { QuickReply } from "@/types/quickReply";

async function authHeaders(token: string) {
  const shopId = await getCurrentShopId();
  return {
    Authorization: `Bearer ${token}`,
    ...(shopId ? { "X-Shop-Id": shopId } : {}),
  };
}

export interface QuickReplyInput {
  shortcut: string;
  message: string;
  images: string[];
}

type QuickReplyResult = { item: QuickReply } | { error: string };

export async function createQuickReply(input: QuickReplyInput): Promise<QuickReplyResult> {
  const token = await getSessionToken();
  if (!token) return { error: "Chưa đăng nhập" };

  try {
    const data = await apiFetch<{ success: boolean; item: QuickReply }>("/quick-replies", {
      method: "POST",
      headers: await authHeaders(token),
      body: JSON.stringify(input),
    });
    return { item: data.item };
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Không tạo được mẫu trả lời nhanh" };
  }
}

export async function updateQuickReply(
  id: string,
  input: QuickReplyInput
): Promise<QuickReplyResult> {
  const token = await getSessionToken();
  if (!token) return { error: "Chưa đăng nhập" };

  try {
    const data = await apiFetch<{ success: boolean; item: QuickReply }>(`/quick-replies/${id}`, {
      method: "PATCH",
      headers: await authHeaders(token),
      body: JSON.stringify(input),
    });
    return { item: data.item };
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Không cập nhật được mẫu trả lời nhanh" };
  }
}

export async function deleteQuickReply(id: string): Promise<{ error?: string }> {
  const token = await getSessionToken();
  if (!token) return { error: "Chưa đăng nhập" };

  try {
    await apiFetch(`/quick-replies/${id}`, {
      method: "DELETE",
      headers: await authHeaders(token),
    });
    return {};
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Không xoá được mẫu trả lời nhanh" };
  }
}
