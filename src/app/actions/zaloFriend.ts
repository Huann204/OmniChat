"use server";

import { ApiError, apiFetch } from "@/lib/api";
import { getCurrentShopId, getSessionToken } from "@/lib/session";

export interface ZaloFoundUser {
  userId: string;
  name: string;
  avatarUrl?: string;
  isFriend: boolean;
  hasSentRequest: boolean;
  // true nếu người này đã gửi lời mời kết bạn cho MÌNH trước đó — zca-js
  // không có cách nào tự động PHÁT HIỆN việc này (không có API/sự kiện liệt
  // kê lời mời đến), chỉ biết được khi đã tra đúng người qua tìm kiếm này.
  hasIncomingRequest: boolean;
}

export interface ZaloFriendItem {
  userId: string;
  name: string;
  avatarUrl?: string;
  phone?: string;
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

export async function findZaloUser(
  pageId: string,
  phone: string
): Promise<{ user?: ZaloFoundUser; error?: string }> {
  try {
    const data = await apiFetch<{ success: boolean; user: ZaloFoundUser }>(
      `/zalo/${pageId}/find-user`,
      { method: "POST", headers: await authHeader(), body: JSON.stringify({ phone }) }
    );
    return { user: data.user };
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Tìm kiếm thất bại" };
  }
}

export async function sendZaloFriendRequest(
  pageId: string,
  userId: string,
  message: string
): Promise<{ error?: string }> {
  try {
    await apiFetch(`/zalo/${pageId}/friend-requests`, {
      method: "POST",
      headers: await authHeader(),
      body: JSON.stringify({ userId, message }),
    });
    return {};
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Gửi lời mời thất bại" };
  }
}

export interface ZaloFriendListResult {
  items: ZaloFriendItem[];
}

const EMPTY_FRIEND_LIST: ZaloFriendListResult = { items: [] };

// Bấm "Nhắn tin" cạnh 1 người trong danh sách bạn bè — tìm hoặc tạo mới hội
// thoại với người này, trả về conversationId để FE mở lên trong Livechat
// (xem InboxView.tsx#handleOpenZaloConversation).
export async function openZaloConversation(
  pageId: string,
  userId: string,
  name: string,
  avatarUrl?: string
): Promise<{ conversationId?: string; error?: string }> {
  try {
    const data = await apiFetch<{ success: boolean; conversationId: string }>(
      `/zalo/${pageId}/conversations`,
      {
        method: "POST",
        headers: await authHeader(),
        body: JSON.stringify({ userId, name, avatarUrl }),
      }
    );
    return { conversationId: data.conversationId };
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Không mở được hội thoại" };
  }
}

// Tải HẾT bạn bè trong 1 lượt gọi (không phân trang) — lọc theo ô tìm kiếm
// hoàn toàn ở client (xem ZaloFriendListModal.tsx), không gọi lại API mỗi
// lần gõ.
export async function listZaloFriends(pageId: string): Promise<ZaloFriendListResult> {
  const token = await getSessionToken();
  if (!token) return EMPTY_FRIEND_LIST;

  try {
    const shopId = await getCurrentShopId();
    const data = await apiFetch<{ success: boolean } & ZaloFriendListResult>(
      `/zalo/${pageId}/friends`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          ...(shopId ? { "X-Shop-Id": shopId } : {}),
        },
      }
    );
    return data;
  } catch {
    return EMPTY_FRIEND_LIST;
  }
}
