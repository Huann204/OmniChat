import "server-only";
import { cookies } from "next/headers";

export const ACCESS_COOKIE = "token";
export const REFRESH_COOKIE = "refreshToken";
const ACCESS_MAX_AGE = 60 * 15; // 15 phút, khớp JWT_ACCESS_EXPIRES_IN
const REFRESH_MAX_AGE = 60 * 60 * 24 * 30; // 30 ngày, khớp JWT_REFRESH_EXPIRES_IN

export async function createSession(accessToken: string, refreshToken: string) {
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
}

export async function getSessionToken() {
  const cookieStore = await cookies();
  return cookieStore.get(ACCESS_COOKIE)?.value;
}

export async function getRefreshToken() {
  const cookieStore = await cookies();
  return cookieStore.get(REFRESH_COOKIE)?.value;
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(ACCESS_COOKIE);
  cookieStore.delete(REFRESH_COOKIE);
}
