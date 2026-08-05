"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ApiError, apiFetch } from "@/lib/api";
import { getSessionToken, setCurrentShopId } from "@/lib/session";

export interface ShopFormState {
  error?: string;
  name?: string;
}

interface ShopResponse {
  success: boolean;
  shop: { id: string; name: string };
  role: "owner" | "admin" | "member";
}

export async function createShop(
  _prevState: ShopFormState,
  formData: FormData
): Promise<ShopFormState> {
  const name = String(formData.get("name") || "").trim();
  if (!name) return { error: "Vui lòng nhập tên Shop" };

  const token = await getSessionToken();
  if (!token) return { error: "Chưa đăng nhập" };

  let data: ShopResponse;
  try {
    data = await apiFetch<ShopResponse>("/shops", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name }),
    });
  } catch (err) {
    return {
      error: err instanceof ApiError ? err.message : "Không tạo được Shop",
      name,
    };
  }

  await setCurrentShopId(data.shop.id);
  // redirect() không tự làm mới layout gốc (AuthSessionProvider) nếu URL
  // đích trùng URL hiện tại (vd tạo shop ngay trên /dashboard) — không có
  // revalidate, store vẫn giữ danh sách shops cũ từ trước khi tạo.
  revalidatePath("/", "layout");
  redirect("/dashboard");
}

// Đổi Shop đang active (hoặc tự chọn khi user chỉ có đúng 1 Shop) — gọi trực
// tiếp từ client component, không qua <form>, vì không cần state lỗi/pending
// phức tạp như createShop.
export async function switchShop(shopId: string) {
  const token = await getSessionToken();
  if (!token) return;

  try {
    // Backend chỉ trả { success } — shopId frontend đã có sẵn từ tham số,
    // không cần API trả lại thông tin Shop (xem shop.controller.ts#switchShop).
    await apiFetch<{ success: boolean }>(`/shops/${shopId}/switch`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    return;
  }

  await setCurrentShopId(shopId);
  revalidatePath("/", "layout");
  redirect("/dashboard");
}
