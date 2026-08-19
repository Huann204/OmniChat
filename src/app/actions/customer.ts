"use server";

import { revalidatePath } from "next/cache";
import { ApiError, apiFetch } from "@/lib/api";
import { getCurrentShopId, getSessionToken } from "@/lib/session";

// 1 hội thoại đang gắn với khách này — có thể nhiều nếu khách nhắn qua nhiều
// kênh khác nhau (Zalo + Facebook...), xem customer.model.ts.
export interface CustomerConversation {
  id: string;
  pageId: string;
  type: number;
  lastMessageAt: string;
}

// Hồ sơ khách hàng — entity ĐỘC LẬP (tên/avatar/phone/note riêng, không tự
// đọc lại từ Conversation), có thể gắn với nhiều Conversation cùng lúc.
export interface CustomerItem {
  id: string;
  name: string;
  avatarUrl?: string;
  // Page GỐC lúc hồ sơ được tạo lần đầu (Customer.page phía server) — ổn
  // định, khác `conversations[]` bên dưới (có thể nhiều nếu sau này gộp
  // thêm kênh khác).
  pageId: string;
  type: number;
  phone: string;
  note: string;
  conversations: CustomerConversation[];
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

export async function updateCustomer(
  customerId: string,
  fields: { name?: string; phone?: string; note?: string }
): Promise<{ customer?: CustomerItem; error?: string }> {
  try {
    const data = await apiFetch<{ success: boolean; customer: CustomerItem }>(
      `/customers/${customerId}`,
      {
        method: "PATCH",
        headers: await authHeader(),
        body: JSON.stringify(fields),
      }
    );
    revalidatePath("/customers");
    return { customer: data.customer };
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Không lưu được" };
  }
}
