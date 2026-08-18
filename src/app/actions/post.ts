"use server";

import { revalidatePath } from "next/cache";
import { ApiError, apiFetch } from "@/lib/api";
import { getCurrentShopId, getSessionToken } from "@/lib/session";

export type PostStatus = "draft" | "scheduled" | "published" | "failed";

export interface PostItem {
  id: string;
  page: string;
  content: string;
  imageUrl?: string;
  status: PostStatus;
  scheduledFor?: string;
  publishedAt?: string;
  facebookPostId?: string;
  errorMessage?: string;
}

async function authHeader() {
  const token = await getSessionToken();
  if (!token) throw new Error("Chưa đăng nhập");
  const shopId = await getCurrentShopId();
  return {
    Authorization: `Bearer ${token}`,
    ...(shopId ? { "X-Shop-Id": shopId } : {}),
  };
}

export interface CreatePostInput {
  pageId: string;
  content: string;
  imageUrl?: string;
  mode: "publish" | "schedule" | "draft";
  scheduledFor?: string;
}

export async function createPost(
  input: CreatePostInput
): Promise<{ post?: PostItem; error?: string }> {
  try {
    const data = await apiFetch<{ success: boolean; post: PostItem }>("/posts", {
      method: "POST",
      headers: await authHeader(),
      body: JSON.stringify(input),
    });
    revalidatePath("/posts");
    return { post: data.post };
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Đăng bài thất bại" };
  }
}

export interface UpdatePostInput {
  content?: string;
  imageUrl?: string | null;
  scheduledFor?: string;
  // Chỉ truyền khi CHUYỂN trạng thái bài nháp/đã lên lịch có sẵn (đăng ngay
  // hoặc đổi sang hẹn giờ) — không truyền thì chỉ sửa nội dung, giữ nguyên
  // status hiện tại (xem post.controller.ts#updatePost).
  mode?: "publish" | "schedule";
}

export async function updatePost(
  id: string,
  input: UpdatePostInput
): Promise<{ post?: PostItem; error?: string }> {
  try {
    const data = await apiFetch<{ success: boolean; post: PostItem }>(`/posts/${id}`, {
      method: "PATCH",
      headers: await authHeader(),
      body: JSON.stringify(input),
    });
    revalidatePath("/posts");
    return { post: data.post };
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Cập nhật bài viết thất bại" };
  }
}

// Bài đã đăng thật -> backend tự gỡ luôn trên Facebook trước khi xoá record
// (xem server/src/controllers/post.controller.ts#deletePost) — KHÔNG chỉ ẩn
// khỏi danh sách trong app.
export async function deletePost(id: string): Promise<{ success?: boolean; error?: string }> {
  try {
    await apiFetch(`/posts/${id}`, { method: "DELETE", headers: await authHeader() });
    revalidatePath("/posts");
    return { success: true };
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Không xoá được bài viết" };
  }
}
