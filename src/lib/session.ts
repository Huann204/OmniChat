import "server-only";
import { cookies } from "next/headers";

export const ACCESS_COOKIE = "token";
export const REFRESH_COOKIE = "refreshToken";
export const SHOP_COOKIE = "current_shop_id";
// Không khai báo hằng ACCESS_MAX_AGE-kiểu ở đây vì cookie này KHÔNG được ghi
// từ server (xem lib/mergePagesCookie.ts — ghi thẳng bằng document.cookie ở
// client để tránh vòng round-trip thừa lúc điều hướng sang /livechat), chỉ
// đọc lại ở đây.
const MERGE_PAGES_COOKIE = "merge_pages";
const ACCESS_MAX_AGE = 60 * 15; // 15 phút, khớp JWT_ACCESS_EXPIRES_IN
const REFRESH_MAX_AGE = 60 * 60 * 24 * 30; // 30 ngày, khớp JWT_REFRESH_EXPIRES_IN

export async function createSession(accessToken: string, refreshToken: string, shopId?: string) {
  const cookieStore = await cookies();
  const secure = process.env.NODE_ENV === "production";

  cookieStore.set(ACCESS_COOKIE, accessToken, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: ACCESS_MAX_AGE,
  });
  cookieStore.set(REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: REFRESH_MAX_AGE,
  });

  if (shopId) {
    await setCurrentShopId(shopId);
  }
}

// Shop đang active — sống theo cả phiên đăng nhập (giống user_info), không
// phải theo access token ngắn hạn, vì đổi shop không nên bắt đăng nhập lại.
export async function setCurrentShopId(shopId: string) {
  const cookieStore = await cookies();
  const secure = process.env.NODE_ENV === "production";

  cookieStore.set(SHOP_COOKIE, shopId, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: REFRESH_MAX_AGE,
  });
}

export async function getCurrentShopId(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(SHOP_COOKIE)?.value;
}

export async function getSessionToken() {
  const cookieStore = await cookies();
  return cookieStore.get(ACCESS_COOKIE)?.value;
}

export async function getRefreshToken() {
  const cookieStore = await cookies();
  return cookieStore.get(REFRESH_COOKIE)?.value;
}

// Cookie này được ghi ở CLIENT (document.cookie, xem lib/mergePagesCookie.ts),
// không phải qua createSession()/Server Action — chỉ đọc lại ở đây để
// livechat/page.tsx biết đang gộp xem những Page nào.
export async function getMergePagesCookie(): Promise<string[]> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(MERGE_PAGES_COOKIE)?.value;
  if (!raw) return [];
  return decodeURIComponent(raw)
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(ACCESS_COOKIE);
  cookieStore.delete(REFRESH_COOKIE);
  cookieStore.delete(SHOP_COOKIE);
}
