"use server";

import { ApiError, apiFetch } from "@/lib/api";
import { getCurrentShopId, getSessionToken } from "@/lib/session";
import type { ShopMember, ShopRole } from "@/types/shopMember";

async function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

// Chỉ thêm được người ĐÃ có tài khoản sẵn trong hệ thống (nhập đúng email đã
// đăng ký) — chưa có luồng mời qua email cho người chưa từng đăng ký, xem
// server/src/controllers/shop.controller.ts#addMember. allowedPages chỉ có
// ý nghĩa khi role="member" (server tự bỏ qua nếu role khác).
export async function addShopMember(
  email: string,
  role: ShopRole,
  allowedPages?: string[]
): Promise<{ member: ShopMember } | { error: string }> {
  const token = await getSessionToken();
  const shopId = await getCurrentShopId();
  if (!token || !shopId) return { error: "Chưa đăng nhập" };

  try {
    const data = await apiFetch<{ success: boolean; member: ShopMember }>(
      `/shops/${shopId}/members`,
      {
        method: "POST",
        headers: await authHeaders(token),
        body: JSON.stringify({ email, role, allowedPages }),
      }
    );
    return { member: data.member };
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Không thêm được nhân viên" };
  }
}

export interface ShopMemberUpdateResult {
  id: string;
  role: ShopRole;
  allowedPages: string[];
}

// allowedPages là optional — không truyền thì server giữ nguyên giá trị cũ
// (xem shop.controller.ts#changeMemberRole), chỉ đổi role. Trả về CHỈ phần
// đã đổi (không có `user`, backend không trả lại) — nơi gọi tự merge vào
// member đã có sẵn trong state thay vì thay nguyên object.
export async function changeShopMemberRole(
  memberId: string,
  role: ShopRole,
  allowedPages?: string[]
): Promise<{ member: ShopMemberUpdateResult } | { error: string }> {
  const token = await getSessionToken();
  const shopId = await getCurrentShopId();
  if (!token || !shopId) return { error: "Chưa đăng nhập" };

  try {
    const data = await apiFetch<{ success: boolean; member: ShopMemberUpdateResult }>(
      `/shops/${shopId}/members/${memberId}`,
      {
        method: "PATCH",
        headers: await authHeaders(token),
        body: JSON.stringify({ role, allowedPages }),
      }
    );
    return { member: data.member };
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Không đổi được vai trò" };
  }
}

export async function removeShopMember(memberId: string): Promise<{ error?: string }> {
  const token = await getSessionToken();
  const shopId = await getCurrentShopId();
  if (!token || !shopId) return { error: "Chưa đăng nhập" };

  try {
    await apiFetch(`/shops/${shopId}/members/${memberId}`, {
      method: "DELETE",
      headers: await authHeaders(token),
    });
    return {};
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Không xoá được nhân viên" };
  }
}
