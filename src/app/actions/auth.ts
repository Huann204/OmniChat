"use server";

import { revalidatePath } from "next/cache";
import { ApiError, apiFetch } from "@/lib/api";
import { getMyShops } from "@/lib/dal";
import { createSession, deleteSession, getRefreshToken, setCurrentShopId } from "@/lib/session";

export interface AuthFormState {
  error?: string;
  success?: boolean;
  redirectTo?: string;
  name?: string;
  email?: string;
}

interface AuthResponse {
  success: boolean;
  accessToken: string;
  refreshToken: string;
  user: { id: string; name: string; email: string; lastShopId?: string };
}

interface RegisterResponse extends AuthResponse {
  shop: { id: string; name: string };
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

  const shops = await getMyShops();
  const defaultShop =
    shops.find((s) => s.id === data.user.lastShopId) ??
    shops.find((s) => s.role === "owner") ??
    shops[0];
  if (defaultShop) {
    await setCurrentShopId(defaultShop.id);
  }

  revalidatePath("/", "layout");
  return { success: true, redirectTo: "/dashboard" };
}

export async function register(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");

  if (!name || !email || !password) {
    return { error: "Vui lòng nhập đầy đủ thông tin", name, email };
  }
  if (password.length < 6) {
    return { error: "Mật khẩu phải có ít nhất 6 ký tự", name, email };
  }
  if (confirmPassword !== password) {
    return { error: "Mật khẩu nhập lại không khớp", name, email };
  }

  let data: RegisterResponse;
  try {
    data = await apiFetch<RegisterResponse>("/auth/register", {
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

  await createSession(data.accessToken, data.refreshToken, data.shop.id);
  revalidatePath("/", "layout");
  return { success: true, redirectTo: "/dashboard" };
}

export interface RequestPasswordResetState {
  error?: string;
  message?: string;
}

interface ForgotPasswordResponse {
  success: boolean;
  message: string;
}

export async function requestPasswordReset(
  _prevState: RequestPasswordResetState,
  formData: FormData
): Promise<RequestPasswordResetState> {
  const email = String(formData.get("email") || "").trim();
  if (!email) {
    return { error: "Vui lòng nhập email" };
  }

  try {
    const data = await apiFetch<ForgotPasswordResponse>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
    return { message: data.message };
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Có lỗi xảy ra, vui lòng thử lại" };
  }
}

export interface ResetPasswordState {
  error?: string;
  success?: boolean;
}

export async function resetPassword(
  _prevState: ResetPasswordState,
  formData: FormData
): Promise<ResetPasswordState> {
  const token = String(formData.get("token") || "");
  const newPassword = String(formData.get("newPassword") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");

  if (!token) {
    return { error: "Link đặt lại mật khẩu không hợp lệ" };
  }
  if (newPassword.length < 6) {
    return { error: "Mật khẩu mới phải có ít nhất 6 ký tự" };
  }
  if (newPassword !== confirmPassword) {
    return { error: "Mật khẩu nhập lại không khớp" };
  }

  try {
    await apiFetch("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, newPassword }),
    });
    return { success: true };
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Đặt lại mật khẩu thất bại" };
  }
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
