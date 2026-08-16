import { NextRequest, NextResponse } from 'next/server';

const ACCESS_COOKIE = 'token';
const REFRESH_COOKIE = 'refreshToken';
const SHOP_COOKIE = 'current_shop_id';
const REFRESH_GUARD_COOKIE = '__refreshed';
// Đánh dấu "vừa gọi Express thất bại vì lý do mạng" (không phải bị từ chối).
// Dùng để chặn vòng lặp redirect vô hạn /login <-> /dashboard khi backend
// tạm thời không phản hồi được (network lỗi, hoặc đang cold-start).
const UNREACHABLE_COOKIE = '__authUnreachable';
const UNREACHABLE_MAX_AGE = 30;
const ACCESS_MAX_AGE = 60 * 15;
const REFRESH_MAX_AGE = 60 * 60 * 24 * 30;
const API_URL = process.env.API_URL || 'http://localhost:3000/api';

const protectedPrefixes = ['/dashboard'];
const authPaths = ['/login', '/register'];
// Quên/đặt lại mật khẩu CỐ TÌNH không nằm trong authPaths (không kích hoạt
// nhánh isAuthPage bên dưới) — user vẫn phải xem/dùng được 2 trang này ngay
// cả khi đang có session hợp lệ (vd bấm link trong email lúc đang đăng nhập
// sẵn ở tab/thiết bị khác), không muốn tự động đá về /dashboard như /login.
const otherPublicAuthPaths = ['/forgot-password', '/reset-password'];
// Trang chủ + các trang auth là public duy nhất ở cấp root — bất kỳ segment
// gốc nào khác (vd. /[pageId] của trang chi tiết bot) đều coi là cần đăng
// nhập.
const publicRootPaths = ['/', ...authPaths, ...otherPublicAuthPaths];

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

  // Route gốc dạng /pageId (1 segment, không phải trang public) — vd. trang
  // chi tiết bot /[pageId] — cũng cần đăng nhập như /dashboard/*.
  const isRootDynamicRoute = /^\/[^/]+$/.test(pathname) && !publicRootPaths.includes(pathname);
  const isProtected =
    protectedPrefixes.some((prefix) => pathname.startsWith(prefix)) || isRootDynamicRoute;
  const isAuthPage = authPaths.includes(pathname);
  const hasSession = Boolean(refreshToken);

  if (isProtected && !hasSession) {
    const url = new URL('/login', request.url);
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  // Chỉ đá về /dashboard nếu KHÔNG vừa gặp lỗi mạng gần đây — tránh trường
  // hợp verifySession() (không xác thực được vì Express không phản hồi) vừa
  // đá user về /login, rồi proxy lại đá ngược về /dashboard dựa trên cookie
  // vẫn còn, tạo vòng lặp vô hạn.
  if (isAuthPage && hasSession && !request.cookies.has(UNREACHABLE_COOKIE)) {
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
        signal: AbortSignal.timeout(8000),
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
        response.cookies.delete(UNREACHABLE_COOKIE);
        return response;
      }

      // Express phản hồi rõ ràng từ chối (401: refresh token sai/hết hạn/đã
      // bị revoke) -> đây mới thực sự là phiên không hợp lệ. Xoá luôn
      // current_shop_id theo access/refresh — không chỉ xoá 2 cookie đó,
      // tránh phiên đăng nhập kế tiếp lỡ dính Shop cũ.
      const response = isProtected
        ? NextResponse.redirect(new URL('/login', request.url))
        : NextResponse.next();
      response.cookies.delete(ACCESS_COOKIE);
      response.cookies.delete(REFRESH_COOKIE);
      response.cookies.delete(SHOP_COOKIE);
      return response;
    } catch {
      // Không gọi được Express (mất mạng, timeout, hoặc backend đang "ngủ"
      // và cold-start chưa kịp phản hồi - vd. Render free tier). Đây KHÔNG
      // phải bằng chứng phiên đăng nhập không hợp lệ, nên KHÔNG xoá cookie.
      // Cứ để request đi tiếp với access token cũ; lần truy cập kế tiếp khi
      // backend đã sẵn sàng sẽ tự refresh lại bình thường mà không bắt user
      // đăng nhập lại oan. Đánh dấu "unreachable" ngắn hạn để tránh vòng lặp
      // redirect nếu trang đích cũng không xác thực được (xem ghi chú ở
      // nhánh isAuthPage phía trên).
      const response = NextResponse.next();
      response.cookies.set(UNREACHABLE_COOKIE, '1', {
        httpOnly: true,
        path: '/',
        maxAge: UNREACHABLE_MAX_AGE,
      });
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  // Chạy trên mọi route trừ nội bộ Next (_next), api, và file tĩnh (favicon,
  // ảnh trong /public,...) — để bao được route gốc /[pageId] mới mà không
  // chặn nhầm asset. Logic isProtected/isAuthPage phía trên mới quyết định
  // route nào thực sự cần đăng nhập.
  matcher: ['/((?!_next/static|_next/image|api|favicon.ico|.*\\..*).*)'],
};
