"use server";

import { revalidatePath } from "next/cache";
import { ApiError, apiFetch } from "@/lib/api";
import { getMyShops } from "@/lib/dal";
import { createSession, deleteSession, getRefreshToken, setCurrentShopId } from "@/lib/session";

export interface AuthFormState {
  error?: string;
  success?: boolean;
  redirectTo?: string;
  // Chỉ echo lại các field không nhạy cảm để prefill form khi submit lỗi
  // (React 19 tự reset input không controlled sau mỗi lần gọi action).
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

  await createSession(data.accessToken, data.refreshToken, data.user);

  // Không còn màn chọn Shop — luôn tự quyết định thẳng 1 Shop để vào:
  // ưu tiên Shop lần trước user đã chọn (lastShopId, cập nhật mỗi khi
  // switchShop/createShop — chỉ dùng nếu vẫn còn là thành viên active,
  // đề phòng đã bị xoá khỏi Shop đó từ lần đăng nhập trước); không có thì
  // về Shop do chính họ sở hữu (role "owner", luôn có sẵn nhờ register tự
  // tạo — xem auth.controller.ts#register); cuối cùng mới tới Shop bất kỳ
  // đang có. Muốn đổi Shop khác thì dùng ShopSwitcherMenu trên navbar.
  const shops = await getMyShops();
  const defaultShop =
    shops.find((s) => s.id === data.user.lastShopId) ??
    shops.find((s) => s.role === "owner") ??
    shops[0];
  if (defaultShop) {
    await setCurrentShopId(defaultShop.id);
  }

  revalidatePath("/", "layout");
  // Không dùng redirect() ở đây: điều hướng "mềm" của Next có thể tái sử dụng
  // bản render đã cache của layout gốc (Header) từ trước khi đăng nhập. Trang
  // gọi action này sẽ tự điều hướng cứng (window.location) khi thấy success.
  return { success: true, redirectTo: "/dashboard" };
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

  // register luôn trả về đúng 1 Shop mới tạo (xem auth.controller.ts#register)
  // nên chọn thẳng luôn, không cần qua màn chọn Shop.
  await createSession(data.accessToken, data.refreshToken, data.user, data.shop.id);
  revalidatePath("/", "layout");
  return { success: true, redirectTo: "/dashboard" };
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
