import "server-only";
import { cookies } from "next/headers";

export const ACCESS_COOKIE = "token";
export const REFRESH_COOKIE = "refreshToken";
const USER_INFO_COOKIE = "user_info";
export const SHOP_COOKIE = "current_shop_id";
// Không khai báo hằng ACCESS_MAX_AGE-kiểu ở đây vì cookie này KHÔNG được ghi
// từ server (xem lib/mergePagesCookie.ts — ghi thẳng bằng document.cookie ở
// client để tránh vòng round-trip thừa lúc điều hướng sang /livechat), chỉ
// đọc lại ở đây.
const MERGE_PAGES_COOKIE = "merge_pages";
const ACCESS_MAX_AGE = 60 * 15; // 15 phút, khớp JWT_ACCESS_EXPIRES_IN
const REFRESH_MAX_AGE = 60 * 60 * 24 * 30; // 30 ngày, khớp JWT_REFRESH_EXPIRES_IN

export interface CachedUser {
  id: string;
  name: string;
  email: string;
}

// user_info không phải thông tin bí mật/định danh phiên (chỉ để hiển thị
// tên/email) — cache riêng để getUser() không phải gọi /auth/me (tức query
// Mongo) mỗi lần chuyển trang. Sống theo refresh token (30 ngày) vì name/
// email hầu như không đổi trong 1 phiên đăng nhập; nếu sau này có tính năng
// đổi tên/email, nhớ xoá cookie này (hoặc gọi lại createSession) để đồng bộ.
export async function createSession(
  accessToken: string,
  refreshToken: string,
  user?: CachedUser,
  shopId?: string
) {
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

  if (user) {
    cookieStore.set(USER_INFO_COOKIE, JSON.stringify(user), {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: REFRESH_MAX_AGE,
    });
  }

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

// Trả về null nếu chưa có cache (phiên cũ từ trước khi có cơ chế này, hoặc
// cookie bị xoá) — nơi gọi phải tự fallback sang gọi /auth/me.
export async function getCachedUser(): Promise<CachedUser | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(USER_INFO_COOKIE)?.value;
  if (!raw) return null;

  try {
    return JSON.parse(raw) as CachedUser;
  } catch {
    return null;
  }
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
  cookieStore.delete(USER_INFO_COOKIE);
  cookieStore.delete(SHOP_COOKIE);
}
