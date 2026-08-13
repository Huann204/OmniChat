import { NextResponse } from "next/server";
import { getCurrentShopId, getSessionToken } from "@/lib/session";

const API_URL = process.env.API_URL || "http://localhost:3000/api";

// Route Handler thay vì Server Action — cùng lý do với api/media/upload:
// Server Actions giới hạn body 1MB mặc định, không đủ cho file gốc. Dùng cho
// thư viện "Tệp và video" ở khung chat (FilePickerModal) — khác api/media/upload
// (thư viện ảnh), nhận file BẤT KỲ, không chỉ ảnh.
export async function POST(request: Request) {
  const token = await getSessionToken();
  if (!token) {
    return NextResponse.json({ success: false, message: "Chưa đăng nhập" }, { status: 401 });
  }

  const shopId = await getCurrentShopId();
  const incoming = await request.formData();

  const res = await fetch(`${API_URL}/media/upload-files`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      ...(shopId ? { "X-Shop-Id": shopId } : {}),
    },
    body: incoming,
  });

  const data = await res.json().catch(() => null);
  return NextResponse.json(data, { status: res.status });
}
