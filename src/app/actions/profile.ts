"use server";

import { revalidatePath } from "next/cache";
import { ApiError, apiFetch } from "@/lib/api";
import { createSession, getSessionToken } from "@/lib/session";
import type { SessionUser } from "@/lib/dal";

interface ProfileResponse {
  success: boolean;
  user: SessionUser;
}

export interface ProfileFormState {
  error?: string;
  success?: boolean;
}

// Chỉ đổi được tên hiển thị — không đổi email ở v1 (xem
// server/src/controllers/auth.controller.ts#updateProfile).
export async function updateProfile(
  _prevState: ProfileFormState,
  formData: FormData
): Promise<ProfileFormState> {
  const name = String(formData.get("name") || "").trim();
  if (!name) return { error: "Vui lòng nhập tên" };

  const token = await getSessionToken();
  if (!token) return { error: "Chưa đăng nhập" };

  try {
    await apiFetch<ProfileResponse>("/auth/me", {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name }),
    });
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Không cập nhật được hồ sơ" };
  }

  // Không còn cache tên/avatar ở cookie riêng (getUser() giờ luôn gọi
  // /auth/me — xem lib/dal.ts) nên chỉ cần revalidate để lần render kế tiếp
  // tự lấy dữ liệu mới, không phải tự ghi đè cookie nào ở đây nữa.
  revalidatePath("/", "layout");

  return { success: true };
}

export interface PasswordFormState {
  error?: string;
  success?: boolean;
}

// Đổi mật khẩu xong server thu hồi hết refresh token cũ (đăng xuất mọi thiết
// bị khác) và cấp lại cặp token mới cho đúng phiên này — phải ghi đè cookie
// access/refresh ngay, nếu không request kế tiếp sẽ dùng refresh token cũ đã
// bị thu hồi và bị văng ra.
export async function changePassword(
  _prevState: PasswordFormState,
  formData: FormData
): Promise<PasswordFormState> {
  const currentPassword = String(formData.get("currentPassword") || "");
  const newPassword = String(formData.get("newPassword") || "");

  if (!currentPassword || !newPassword) {
    return { error: "Vui lòng nhập đầy đủ mật khẩu cũ và mới" };
  }
  if (newPassword.length < 6) {
    return { error: "Mật khẩu mới phải có ít nhất 6 ký tự" };
  }

  const token = await getSessionToken();
  if (!token) return { error: "Chưa đăng nhập" };

  let data: { success: boolean; accessToken: string; refreshToken: string };
  try {
    data = await apiFetch("/auth/change-password", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Không đổi được mật khẩu" };
  }

  await createSession(data.accessToken, data.refreshToken);

  return { success: true };
}
