"use server";

import { ApiError, apiFetch } from "@/lib/api";
import { getSessionToken } from "@/lib/session";

export interface FacebookPageOption {
  pageId: string;
  pageName: string;
  category?: string;
  pictureUrl?: string;
}

export interface ConnectedFacebookPage {
  id: string;
  type: number;
  pageId: string;
  name: string;
  category?: string;
  picture?: string;
  active: boolean;
}

async function authHeader() {
  const token = await getSessionToken();
  if (!token) throw new Error("Chưa đăng nhập");
  return { Authorization: `Bearer ${token}` };
}

export async function listFacebookPages(
  userAccessToken: string
): Promise<{ pages?: FacebookPageOption[]; error?: string }> {
  try {
    const data = await apiFetch<{ success: boolean; pages: FacebookPageOption[] }>(
      "/facebook/pages",
      {
        method: "POST",
        headers: await authHeader(),
        body: JSON.stringify({ userAccessToken }),
      }
    );
    return { pages: data.pages };
  } catch (err) {
    return {
      error: err instanceof ApiError ? err.message : "Không lấy được danh sách Page",
    };
  }
}

export async function connectFacebookPage(
  pageId: string
): Promise<{ page?: ConnectedFacebookPage; error?: string }> {
  try {
    const data = await apiFetch<{ success: boolean; page: ConnectedFacebookPage }>(
      "/facebook/pages/connect",
      {
        method: "POST",
        headers: await authHeader(),
        body: JSON.stringify({ pageId }),
      }
    );
    return { page: data.page };
  } catch (err) {
    return {
      error: err instanceof ApiError ? err.message : "Không kết nối được Page này",
    };
  }
}
