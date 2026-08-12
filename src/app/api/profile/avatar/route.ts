import { NextResponse } from "next/server";
import { createSession, getRefreshToken, getSessionToken, type CachedUser } from "@/lib/session";

const API_URL = process.env.API_URL || "http://localhost:3000/api";

// Route Handler thay vì Server Action — cùng lý do với api/media/upload:
// Server Actions giới hạn body 1MB mặc định, không đủ cho file ảnh gốc.
export async function POST(request: Request) {
  const token = await getSessionToken();
  const refreshToken = await getRefreshToken();
  if (!token || !refreshToken) {
    return NextResponse.json({ success: false, message: "Chưa đăng nhập" }, { status: 401 });
  }

  const incoming = await request.formData();

  const res = await fetch(`${API_URL}/auth/me/avatar`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: incoming,
  });

  const data = await res.json().catch(() => null);

  // Thành công thì làm mới cookie user_info ngay (avatar mới hiện trên
  // navbar mà không cần F5) — bằng đúng token hiện có, không đổi phiên.
  if (res.ok && data?.user) {
    await createSession(token, refreshToken, data.user as CachedUser);
  }

  return NextResponse.json(data, { status: res.status });
}
