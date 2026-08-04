"use server";

import { ApiError, apiFetch } from "@/lib/api";
import { getSessionToken } from "@/lib/session";
import type { MediaItem } from "@/types/media";

interface ListMediaResult {
  items: MediaItem[];
  total: number;
  page: number;
  pages: number;
}

export async function listMedia(params: {
  page?: number;
  search?: string;
}): Promise<ListMediaResult> {
  const token = await getSessionToken();
  if (!token) return { items: [], total: 0, page: 1, pages: 1 };

  const query = new URLSearchParams();
  query.set("page", String(params.page ?? 1));
  if (params.search) query.set("search", params.search);

  try {
    const data = await apiFetch<{ success: boolean } & ListMediaResult>(
      `/media?${query.toString()}`,
      { headers: { Authorization: `Bearer ${token}` } }
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
      headers: { Authorization: `Bearer ${token}` },
    });
    return {};
  } catch (err) {
    return {
      error: err instanceof ApiError ? err.message : "Không xoá được ảnh",
    };
  }
}
