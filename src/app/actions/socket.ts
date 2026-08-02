"use server";

import { apiFetch } from "@/lib/api";
import { getSessionToken } from "@/lib/session";

// Ticket sống 60s, chỉ dùng để mở kết nối Socket.IO — không phải access
// token thật, nên đưa cho client JS (biến qua props/response bình thường)
// không phá vỡ nguyên tắc httpOnly cookie đang dùng cho phiên đăng nhập.
export async function getSocketTicket(): Promise<string | null> {
  const token = await getSessionToken();
  if (!token) return null;

  try {
    const data = await apiFetch<{ success: boolean; ticket: string }>(
      "/auth/socket-ticket",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return data.ticket;
  } catch {
    return null;
  }
}
