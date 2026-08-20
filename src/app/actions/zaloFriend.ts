"use server";

import { ApiError, apiFetch } from "@/lib/api";
import { getCurrentShopId, getSessionToken } from "@/lib/session";

export interface ZaloFoundUser {
  userId: string;
  name: string;
  avatarUrl?: string;
  isFriend: boolean;
  hasSentRequest: boolean;
  // true nếu người này đã gửi lời mời kết bạn cho MÌNH trước đó — xem thêm
  // listZaloFriendRequests() bên dưới để liệt kê ĐẦY ĐỦ mọi lời mời đến
  // (field này chỉ biết được khi đã tra đúng người qua tìm kiếm này).
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
  // Có giá trị khi gọi API thất bại — PHÂN BIỆT với "items: [] vì thật sự
  // rỗng" (VD mất phiên đăng nhập Zalo, lỗi mạng...). Trước đây nuốt lỗi
  // thành mảng rỗng, khiến "lỗi" và "0 kết quả" hiện y hệt nhau, không biết
  // đâu mà debug.
  error?: string;
}

const EMPTY_FRIEND_LIST: ZaloFriendListResult = { items: [] };

function emptyWithError(err: unknown, fallback: string): ZaloFriendListResult {
  return { items: [], error: err instanceof ApiError ? err.message : fallback };
}

// Bấm "Nhắn tin" cạnh 1 người trong danh sách bạn bè — tìm hoặc tạo mới hội
// thoại với người này, trả về conversationId để FE mở lên trong Livechat
// (xem InboxView.tsx#handleOpenZaloConversation).
export async function openZaloConversation(
  pageId: string,
  userId: string,
  name: string,
  avatarUrl?: string,
  isGroup?: boolean
): Promise<{ conversationId?: string; error?: string }> {
  try {
    const data = await apiFetch<{ success: boolean; conversationId: string }>(
      `/zalo/${pageId}/conversations`,
      {
        method: "POST",
        headers: await authHeader(),
        body: JSON.stringify({ userId, name, avatarUrl, isGroup }),
      }
    );
    return { conversationId: data.conversationId };
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Không mở được hội thoại" };
  }
}

// Danh sách lời mời kết bạn GỬI ĐẾN mình (xem
// zaloFriend.controller.ts#listZaloFriendRequests) — cũng không phân trang,
// danh sách này thường ngắn hơn nhiều so với bạn bè.
export async function listZaloFriendRequests(pageId: string): Promise<ZaloFriendListResult> {
  const token = await getSessionToken();
  if (!token) return EMPTY_FRIEND_LIST;

  try {
    const shopId = await getCurrentShopId();
    const data = await apiFetch<{ success: boolean } & ZaloFriendListResult>(
      `/zalo/${pageId}/friend-requests`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          ...(shopId ? { "X-Shop-Id": shopId } : {}),
        },
      }
    );
    return data;
  } catch (err) {
    return emptyWithError(err, "Không tải được lời mời kết bạn đến");
  }
}

export async function acceptZaloFriendRequest(
  pageId: string,
  userId: string
): Promise<{ error?: string }> {
  try {
    await apiFetch(`/zalo/${pageId}/friend-requests/accept`, {
      method: "POST",
      headers: await authHeader(),
      body: JSON.stringify({ userId }),
    });
    return {};
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Chấp nhận lời mời thất bại" };
  }
}

export async function rejectZaloFriendRequest(
  pageId: string,
  userId: string
): Promise<{ error?: string }> {
  try {
    await apiFetch(`/zalo/${pageId}/friend-requests/reject`, {
      method: "POST",
      headers: await authHeader(),
      body: JSON.stringify({ userId }),
    });
    return {};
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Từ chối lời mời thất bại" };
  }
}

// Danh sách lời mời kết bạn MÌNH ĐÃ GỬI, chưa được chấp nhận (không có
// `phone` — zca-js không trả kèm SĐT cho danh sách này, khác friends/lời mời
// đến).
export async function listZaloSentFriendRequests(pageId: string): Promise<ZaloFriendListResult> {
  const token = await getSessionToken();
  if (!token) return EMPTY_FRIEND_LIST;

  try {
    const shopId = await getCurrentShopId();
    const data = await apiFetch<{ success: boolean } & ZaloFriendListResult>(
      `/zalo/${pageId}/friend-requests/sent`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          ...(shopId ? { "X-Shop-Id": shopId } : {}),
        },
      }
    );
    return data;
  } catch (err) {
    return emptyWithError(err, "Không tải được lời mời kết bạn đã gửi");
  }
}

export async function undoZaloFriendRequest(
  pageId: string,
  userId: string
): Promise<{ error?: string }> {
  try {
    await apiFetch(`/zalo/${pageId}/friend-requests/undo`, {
      method: "POST",
      headers: await authHeader(),
      body: JSON.stringify({ userId }),
    });
    return {};
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Thu hồi lời mời thất bại" };
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
  } catch (err) {
    return emptyWithError(err, "Không tải được danh sách bạn bè");
  }
}

export interface ZaloGroupItem {
  groupId: string;
  name: string;
  avatarUrl?: string;
  memberCount: number;
}

export interface ZaloGroupListResult {
  items: ZaloGroupItem[];
  error?: string;
}

const EMPTY_GROUP_LIST: ZaloGroupListResult = { items: [] };

// Tải HẾT nhóm đang tham gia trong 1 lượt gọi — lọc theo ô tìm kiếm hoàn
// toàn ở client (mirror listZaloFriends).
export async function listZaloGroups(pageId: string): Promise<ZaloGroupListResult> {
  const token = await getSessionToken();
  if (!token) return EMPTY_GROUP_LIST;

  try {
    const shopId = await getCurrentShopId();
    const data = await apiFetch<{ success: boolean } & ZaloGroupListResult>(
      `/zalo/${pageId}/groups`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          ...(shopId ? { "X-Shop-Id": shopId } : {}),
        },
      }
    );
    return data;
  } catch (err) {
    return {
      items: [],
      error: err instanceof ApiError ? err.message : "Không tải được danh sách nhóm",
    };
  }
}

// Tạo nhóm mới — thành công thì tự mở hội thoại của nhóm vừa tạo luôn (xem
// InboxView.tsx#handleOpenZaloConversation), agent nhắn được ngay.
export async function createZaloGroup(
  pageId: string,
  name: string,
  memberIds: string[],
  avatarUrl?: string
): Promise<{ groupId?: string; error?: string }> {
  try {
    const data = await apiFetch<{ success: boolean; groupId: string }>(`/zalo/${pageId}/groups`, {
      method: "POST",
      headers: await authHeader(),
      body: JSON.stringify({ name, memberIds, avatarUrl }),
    });
    return { groupId: data.groupId };
  } catch (err) {
    return { error: err instanceof ApiError ? err.message : "Tạo nhóm thất bại" };
  }
}
