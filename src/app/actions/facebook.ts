"use server";

import { ApiError, apiFetch } from "@/lib/api";
import { getCurrentShopId, getSessionToken } from "@/lib/session";

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
  status: "active" | "inactive" | "deleted";
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

// Dùng chung cho mọi kênh (Facebook/Zalo/Telegram) dù route nằm dưới
// "/facebook" — đúng chỗ các operation ConnectedPage chung khác đã sống (xem
// listConnectedPages ở server). CHỈ đổi status sang "deleted", không tắt
// session Zalo/Telegram đang sống (xem facebook.controller.ts#disconnectPage).
export async function disconnectPage(
  pageId: string
): Promise<{ page?: ConnectedFacebookPage; error?: string }> {
  try {
    const data = await apiFetch<{ success: boolean; page: ConnectedFacebookPage }>(
      `/facebook/pages/${pageId}`,
      { method: "DELETE", headers: await authHeader() }
    );
    return { page: data.page };
  } catch (err) {
    return {
      error: err instanceof ApiError ? err.message : "Không ngắt kết nối được",
    };
  }
}

// Chỉ có ý nghĩa với Zalo/Telegram (có khái niệm "phiên sống" bị rớt) — làm
// mới lại phiên bằng credentials đã lưu, không cần quét QR (xem
// facebook.controller.ts#reconnectPage).
export async function reconnectPage(
  pageId: string
): Promise<{ page?: ConnectedFacebookPage; error?: string }> {
  try {
    const data = await apiFetch<{ success: boolean; page: ConnectedFacebookPage }>(
      `/facebook/pages/${pageId}/reconnect`,
      { method: "POST", headers: await authHeader() }
    );
    return { page: data.page };
  } catch (err) {
    return {
      error: err instanceof ApiError ? err.message : "Làm mới kết nối thất bại",
    };
  }
}
