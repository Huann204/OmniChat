"use server";

import { ApiError, apiFetch } from "@/lib/api";
import { getCurrentShopId, getSessionToken } from "@/lib/session";

export interface RotationSettings {
  enabled: boolean;
  userIds: string[];
}

async function authHeaders(token: string) {
  const shopId = await getCurrentShopId();
  return {
    Authorization: `Bearer ${token}`,
    ...(shopId ? { "X-Shop-Id": shopId } : {}),
  };
}

// Chỉ chủ/quản trị viên gọi được (server chặn) — nhân viên thường nhận lỗi
// 403, trả về cấu hình tắt để trang vẫn render được thay vì vỡ.
export async function getRotationSettings(): Promise<RotationSettings> {
  const token = await getSessionToken();
  if (!token) return { enabled: false, userIds: [] };

  try {
    const data = await apiFetch<{ success: boolean } & RotationSettings>("/rotation", {
      headers: await authHeaders(token),
    });
    return { enabled: data.enabled, userIds: data.userIds };
  } catch {
    return { enabled: false, userIds: [] };
  }
}

export async function saveRotationSettings(
  settings: RotationSettings
): Promise<{ settings: RotationSettings } | { error: string }> {
  const token = await getSessionToken();
  if (!token) return { error: "Chưa đăng nhập" };

  try {
    const data = await apiFetch<{ success: boolean } & RotationSettings>("/rotation", {
      method: "PUT",
      headers: await authHeaders(token),
      body: JSON.stringify(settings),
    });
    return { settings: { enabled: data.enabled, userIds: data.userIds } };
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Không lưu được cấu hình" };
  }
}
