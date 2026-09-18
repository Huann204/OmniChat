"use server";

import { headers } from "next/headers";
import { ApiError, apiFetch } from "@/lib/api";
import { getCurrentShopId, getSessionToken } from "@/lib/session";

export interface FacebookPageOption {
  pageId: string;
  pageName: string;
  category?: string;
  pictureUrl?: string;
}

export interface WebsiteWidgetConfig {
  primaryColor?: string;
  greeting?: string;
  position?: "left" | "right";
}

export interface ConnectedFacebookPage {
  id: string;
  type: number;
  pageId: string;
  name: string;
  category?: string;
  picture?: string;
  status: "active" | "inactive" | "deleted";
  widgetConfig?: WebsiteWidgetConfig;
  // Chỉ có ý nghĩa với kênh Website.
  domain?: string;
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
      "/pages",
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
      "/pages/connect",
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

// Dùng chung cho mọi kênh (Facebook/Zalo/Telegram/Website) — đúng chỗ các
// operation ConnectedPage chung khác đã sống (xem listConnectedPages ở
// server). CHỈ đổi status sang "deleted", không tắt session Zalo/Telegram
// đang sống (xem facebook.controller.ts#disconnectPage).
export async function disconnectPage(
  pageId: string
): Promise<{ page?: ConnectedFacebookPage; error?: string }> {
  try {
    const data = await apiFetch<{ success: boolean; page: ConnectedFacebookPage }>(
      `/pages/${pageId}`,
      { method: "DELETE", headers: await authHeader() }
    );
    return { page: data.page };
  } catch (err) {
    return {
      error: err instanceof ApiError ? err.message : "Không ngắt kết nối được",
    };
  }
}

// Lúc TẠO chỉ hỏi 3 thứ tối thiểu: tên, tên miền, logo — màu/lời chào/vị trí
// để Shop tự vào "Sửa" (EditWebsiteWidgetModal.tsx) chỉnh sau khi cần, không
// bắt chọn ngay lúc kết nối. Tự build sẵn đoạn <script> hoàn chỉnh để Shop
// copy dán thẳng vào website của họ — dùng headers() đọc host/proto của
// CHÍNH request hiện tại để suy ra domain app đang chạy (đúng cả dev lẫn
// prod, không cần thêm biến môi trường NEXT_PUBLIC_* mới nào).
export async function createWebsiteChannel(
  name: string,
  domain?: string,
  picture?: string
): Promise<{ page?: ConnectedFacebookPage; snippet?: string; error?: string }> {
  try {
    const data = await apiFetch<{ success: boolean; page: ConnectedFacebookPage }>(
      "/pages/website",
      {
        method: "POST",
        headers: await authHeader(),
        body: JSON.stringify({ name, domain, picture }),
      }
    );

    const h = await headers();
    const host = h.get("host");
    const proto = h.get("x-forwarded-proto") || (host?.includes("localhost") ? "http" : "https");
    const origin = `${proto}://${host}`;
    const snippet = `<script src="${origin}/widget.js" data-key="${data.page.pageId}" async></script>`;

    return { page: data.page, snippet };
  } catch (err) {
    return {
      error: err instanceof ApiError ? err.message : "Không tạo được kênh Website",
    };
  }
}

// Sửa lại tên/tên miền/logo/màu/lời chào/vị trí của 1 kênh Website ĐÃ TẠO —
// xem EditWebsiteWidgetModal.tsx (nút "Sửa" trong BotCard.tsx).
export async function updateWebsiteChannel(
  pageId: string,
  patch: { name?: string; domain?: string; picture?: string } & WebsiteWidgetConfig
): Promise<{ page?: ConnectedFacebookPage; error?: string }> {
  try {
    const data = await apiFetch<{ success: boolean; page: ConnectedFacebookPage }>(
      `/pages/${pageId}/website-config`,
      {
        method: "PATCH",
        headers: await authHeader(),
        body: JSON.stringify(patch),
      }
    );
    return { page: data.page };
  } catch (err) {
    return {
      error: err instanceof ApiError ? err.message : "Không lưu được thay đổi",
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
      `/pages/${pageId}/reconnect`,
      { method: "POST", headers: await authHeader() }
    );
    return { page: data.page };
  } catch (err) {
    return {
      error: err instanceof ApiError ? err.message : "Làm mới kết nối thất bại",
    };
  }
}
