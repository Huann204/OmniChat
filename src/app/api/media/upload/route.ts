import { NextResponse } from "next/server";
import { getCurrentShopId, getSessionToken } from "@/lib/session";

const API_URL = process.env.API_URL || "http://localhost:3000/api";

// Route Handler thay vì Server Action: Server Actions giới hạn body 1MB mặc định
// (xem next.config), quá chật cho upload ảnh nhiều file. Route Handler không bị
// giới hạn đó — nhận multipart/form-data từ browser rồi chuyển tiếp nguyên vẹn
// sang Express (nơi thật sự upload lên Cloudinary + lưu Mongo).
export async function POST(request: Request) {
  const token = await getSessionToken();
  if (!token) {
    return NextResponse.json({ success: false, message: "Chưa đăng nhập" }, { status: 401 });
  }

  const shopId = await getCurrentShopId();
  const incoming = await request.formData();

  const res = await fetch(`${API_URL}/media/upload`, {
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
