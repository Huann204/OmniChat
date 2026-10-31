"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ApiError, apiFetch } from "@/lib/api";
import { clearCurrentShopId, getSessionToken, setCurrentShopId } from "@/lib/session";

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

// Đổi tên Shop (chủ Shop, quản trị viên). revalidatePath layout gốc để tên mới
// hiện ngay ở menu chuyển Shop (lấy từ store trong AuthSessionProvider, không
// phải từ trang đang mở).
export async function updateShopInfo(
  shopId: string,
  input: { name: string }
): Promise<{ shop: { id: string; name: string } } | { error: string }> {
  const token = await getSessionToken();
  if (!token) return { error: "Chưa đăng nhập" };

  try {
    const data = await apiFetch<{
      success: boolean;
      shop: { id: string; name: string };
    }>(`/shops/${shopId}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(input),
    });
    revalidatePath("/", "layout");
    return { shop: data.shop };
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Không lưu được thông tin Shop" };
  }
}

// Tự rời Shop. Thành công thì chuyển luôn sang Shop còn lại (BE trả nextShopId),
// không còn Shop nào thì bỏ hẳn cookie Shop — tránh mọi request sau đó mang
// X-Shop-Id của Shop đã mất quyền và bị 403. redirect() ném NEXT_REDIRECT nên
// chỉ có nhánh lỗi mới thật sự return.
export async function leaveShop(shopId: string): Promise<{ error: string }> {
  const token = await getSessionToken();
  if (!token) return { error: "Chưa đăng nhập" };

  let nextShopId: string | null;
  try {
    const data = await apiFetch<{ success: boolean; nextShopId: string | null }>(
      `/shops/${shopId}/leave`,
      { method: "POST", headers: { Authorization: `Bearer ${token}` } }
    );
    nextShopId = data.nextShopId;
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Không rời được Shop" };
  }

  if (nextShopId) await setCurrentShopId(nextShopId);
  else await clearCurrentShopId();
  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export interface SupportShopResult {
  id: string;
  name: string;
  owner: { name: string; email: string } | null;
}

// Chỉ nhân viên hỗ trợ nền tảng (isSupportAdmin) gọi thành công — BE tự chặn
// lại (requireSupportAdmin), xem shop.controller.ts#listAllShops. Tìm TOÀN
// BỘ Shop trong hệ thống theo tên Shop hoặc tên/email chủ sở hữu, để chọn
// đổi vào hỗ trợ trực tiếp — đổi thật vẫn dùng switchShop() ở trên (giống
// hệt luồng đổi Shop bình thường).
export async function searchAllShops(search: string): Promise<SupportShopResult[]> {
  const token = await getSessionToken();
  if (!token) return [];

  try {
    const query = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : "";
    const data = await apiFetch<{ success: boolean; shops: SupportShopResult[] }>(
      `/shops/all${query}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return data.shops;
  } catch {
    return [];
  }
}
