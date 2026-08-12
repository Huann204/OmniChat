import { NextResponse } from "next/server";
import { getSessionToken } from "@/lib/session";

const API_URL = process.env.API_URL || "http://localhost:3000/api";

// Route Handler thay vì Server Action — cùng lý do với api/media/upload:
// Server Actions giới hạn body 1MB mặc định, không đủ cho file ảnh gốc.
export async function POST(request: Request) {
  const token = await getSessionToken();
  if (!token) {
    return NextResponse.json({ success: false, message: "Chưa đăng nhập" }, { status: 401 });
  }

  const incoming = await request.formData();

  const res = await fetch(`${API_URL}/auth/me/avatar`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: incoming,
  });

  const data = await res.json().catch(() => null);

  return NextResponse.json(data, { status: res.status });
}
