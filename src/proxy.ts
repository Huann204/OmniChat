import { NextRequest, NextResponse } from 'next/server';

const ACCESS_COOKIE = 'token';
const REFRESH_COOKIE = 'refreshToken';
const REFRESH_GUARD_COOKIE = '__refreshed';
const ACCESS_MAX_AGE = 60 * 15;
const REFRESH_MAX_AGE = 60 * 60 * 24 * 30;
const API_URL = process.env.API_URL || 'http://localhost:3000/api';

const protectedPrefixes = ['/dashboard'];
const authPaths = ['/login', '/register'];

function isExpiredOrInvalid(accessToken: string | undefined): boolean {
  if (!accessToken) return true;
  try {
    const payloadB64 = accessToken.split('.')[1];
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    if (typeof payload.exp !== 'number') return true;
    // 5s đệm để tránh lệch thời gian giữa các lần request.
    return Date.now() >= payload.exp * 1000 - 5000;
  } catch {
    return true;
  }
}

function setSessionCookies(
  response: NextResponse,
  accessToken: string,
  refreshToken: string
) {
  const secure = process.env.NODE_ENV === 'production';
  response.cookies.set(ACCESS_COOKIE, accessToken, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: ACCESS_MAX_AGE,
  });
  response.cookies.set(REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: REFRESH_MAX_AGE,
  });
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;

  const isProtected = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));
  const isAuthPage = authPaths.includes(pathname);
  const hasSession = Boolean(refreshToken);

  if (isProtected && !hasSession) {
    const url = new URL('/login', request.url);
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthPage && hasSession) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Access token hết hạn (hoặc thiếu) nhưng còn refresh token: làm mới rồi
  // redirect lại chính URL này để request tiếp theo mang theo cookie mới.
  // (Cookie chỉ có thể set trên response, không thể "tiêm" ngược vào lần
  // render Server Component hiện tại.)
  // REFRESH_GUARD_COOKIE chống lặp vô hạn nếu token mới cấp cũng hết hạn
  // ngay lập tức (vd. lệch giờ hệ thống, hoặc TTL cấu hình quá ngắn).
  const alreadyAttemptedRefresh = request.cookies.has(REFRESH_GUARD_COOKIE);

  if (hasSession && isExpiredOrInvalid(accessToken) && !alreadyAttemptedRefresh) {
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (res.ok) {
        const data = await res.json();
        const response = NextResponse.redirect(request.url);
        setSessionCookies(response, data.accessToken, data.refreshToken);
        response.cookies.set(REFRESH_GUARD_COOKIE, '1', {
          httpOnly: true,
          path: '/',
          maxAge: 10,
        });
        return response;
      }
    } catch {
      // Express không phản hồi được -> coi như chưa xác thực, xử lý bên dưới.
    }

    const response = isProtected
      ? NextResponse.redirect(new URL('/login', request.url))
      : NextResponse.next();
    response.cookies.delete(ACCESS_COOKIE);
    response.cookies.delete(REFRESH_COOKIE);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/register'],
};
