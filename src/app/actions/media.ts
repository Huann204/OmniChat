"use server";

import { ApiError, apiFetch } from "@/lib/api";
import { getCurrentShopId, getSessionToken } from "@/lib/session";
import type { MediaItem } from "@/types/media";

async function authHeaders(token: string) {
  const shopId = await getCurrentShopId();
  return {
    Authorization: `Bearer ${token}`,
    ...(shopId ? { "X-Shop-Id": shopId } : {}),
  };
}

interface ListMediaResult {
  items: MediaItem[];
  total: number;
  page: number;
  pages: number;
}

export async function listMedia(params: {
  page?: number;
  search?: string;
  // "image" (mặc định, thư viện ảnh — MediaPickerModal) hoặc "file" (video +
  // file khác — FilePickerModal), khớp resourceTypeFilter ở media.controller.ts.
  type?: "image" | "file";
}): Promise<ListMediaResult> {
  const token = await getSessionToken();
  if (!token) return { items: [], total: 0, page: 1, pages: 1 };

  const query = new URLSearchParams();
  query.set("page", String(params.page ?? 1));
  if (params.search) query.set("search", params.search);
  if (params.type) query.set("type", params.type);

  try {
    const data = await apiFetch<{ success: boolean } & ListMediaResult>(
      `/media?${query.toString()}`,
      { headers: await authHeaders(token) }
    );
    return data;
  } catch {
    return { items: [], total: 0, page: 1, pages: 1 };
  }
}

export async function deleteMedia(id: string): Promise<{ error?: string }> {
  const token = await getSessionToken();
  if (!token) return { error: "Chưa đăng nhập" };

  try {
    await apiFetch(`/media/${id}`, {
      method: "DELETE",
      headers: await authHeaders(token),
    });
    return {};
  } catch (err) {
    return {
      error: err instanceof ApiError ? err.message : "Không xoá được ảnh",
    };
  }
}
