"use server";

import { ApiError, apiFetch } from "@/lib/api";
import { mapRawCustomers, type RawCustomer } from "@/lib/dal";
import { getCurrentShopId, getSessionToken } from "@/lib/session";
import type { Customer } from "@/types/customer";

async function authHeaders(token: string) {
  const shopId = await getCurrentShopId();
  return {
    Authorization: `Bearer ${token}`,
    ...(shopId ? { "X-Shop-Id": shopId } : {}),
  };
}

// Dùng CHUNG cho cả 2 việc từ client: đổi bộ lọc/tìm kiếm (tải lại từ đầu,
// không truyền before/beforeId) và cuộn xuống tải thêm (có before/beforeId) —
// gộp 1 action thay vì 2 bản gần giống nhau. Trang đầu lúc mới vào trang vẫn
// dùng getCustomers (lib/dal.ts) render ở server như bình thường.
export async function fetchCustomers(params?: {
  q?: string;
  type?: number;
  tagId?: string;
  before?: string;
  beforeId?: string;
}): Promise<{ customers: Customer[]; hasMore: boolean }> {
  const token = await getSessionToken();
  if (!token) return { customers: [], hasMore: false };

  try {
    const search = new URLSearchParams();
    if (params?.q) search.set("q", params.q);
    if (params?.type !== undefined) search.set("type", String(params.type));
    if (params?.tagId) search.set("tagId", params.tagId);
    if (params?.before && params?.beforeId) {
      search.set("before", params.before);
      search.set("beforeId", params.beforeId);
    }
    const qs = search.toString();
    const data = await apiFetch<{
      success: boolean;
      hasMore: boolean;
      customers: RawCustomer[];
    }>(`/customers${qs ? `?${qs}` : ""}`, { headers: await authHeaders(token) });

    return { customers: mapRawCustomers(data.customers), hasMore: data.hasMore };
  } catch {
    return { customers: [], hasMore: false };
  }
}

export interface UpdateCustomerInfoInput {
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
}

// Sửa tay thông tin liên hệ khách — field nào KHÔNG truyền vào object này thì
// giữ nguyên, chuỗi rỗng thì xoá (xem customer.controller.ts#updateCustomerInfo).
export async function updateCustomerInfo(
  conversationId: string,
  input: UpdateCustomerInfoInput
): Promise<{ customer: UpdateCustomerInfoInput } | { error: string }> {
  const token = await getSessionToken();
  if (!token) return { error: "Chưa đăng nhập" };

  try {
    const data = await apiFetch<{ success: boolean; customer: UpdateCustomerInfoInput }>(
      `/customers/${conversationId}`,
      { method: "PATCH", headers: await authHeaders(token), body: JSON.stringify(input) }
    );
    return { customer: data.customer };
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Không cập nhật được thông tin khách hàng" };
  }
}
