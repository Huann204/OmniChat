"use server";

import { revalidatePath } from "next/cache";
import { ApiError, apiFetch } from "@/lib/api";
import { createSession, deleteSession, getRefreshToken } from "@/lib/session";

export interface AuthFormState {
  error?: string;
  success?: boolean;
  // Chỉ echo lại các field không nhạy cảm để prefill form khi submit lỗi
  // (React 19 tự reset input không controlled sau mỗi lần gọi action).
  name?: string;
  email?: string;
}

interface AuthResponse {
  success: boolean;
  accessToken: string;
  refreshToken: string;
  user: { id: string; name: string; email: string };
}

export async function login(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    return { error: "Vui lòng nhập email và mật khẩu", email };
  }

  let data: AuthResponse;
  try {
    data = await apiFetch<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  } catch (err) {
    return {
      error: err instanceof ApiError ? err.message : "Đăng nhập thất bại",
      email,
    };
  }

  await createSession(data.accessToken, data.refreshToken);
  revalidatePath("/", "layout");
  // Không dùng redirect() ở đây: điều hướng "mềm" của Next có thể tái sử dụng
  // bản render đã cache của layout gốc (Header) từ trước khi đăng nhập. Trang
  // gọi action này sẽ tự điều hướng cứng (window.location) khi thấy success.
  return { success: true };
}

export async function register(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!name || !email || !password) {
    return { error: "Vui lòng nhập đầy đủ thông tin", name, email };
  }
  if (password.length < 6) {
    return { error: "Mật khẩu phải có ít nhất 6 ký tự", name, email };
  }

  let data: AuthResponse;
  try {
    data = await apiFetch<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });
  } catch (err) {
    return {
      error: err instanceof ApiError ? err.message : "Đăng ký thất bại",
      name,
      email,
    };
  }

  await createSession(data.accessToken, data.refreshToken);
  revalidatePath("/", "layout");
  return { success: true };
}

export async function logout() {
  const refreshToken = await getRefreshToken();

  if (refreshToken) {
    try {
      await apiFetch("/auth/logout", {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
      });
    } catch {
      // Vẫn xoá cookie phía client dù revoke trên server thất bại.
    }
  }

  await deleteSession();
  revalidatePath("/", "layout");
}
