"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const MERGE_PAGES_COOKIE = "merge_pages";
const MERGE_PAGES_MAX_AGE = 60 * 60 * 24; // 1 ngày — đủ để thoát ra rồi quay lại /livechat trong ngày mà không phải gộp lại.

// Tự redirect() ngay trong action thay vì để client gọi router.push() sau
// khi action xong — ghi cookie (mutate) + tự điều hướng trong CÙNG 1 action
// là pattern Next.js khuyến nghị, tránh việc client tự push gây ra 2 lượt
// điều hướng chồng nhau cho cùng 1 lần bấm (đã xác nhận bằng log).
export async function setMergePagesCookie(pageIds: string[]) {
  const cookieStore = await cookies();
  const secure = process.env.NODE_ENV === "production";

  cookieStore.set(MERGE_PAGES_COOKIE, pageIds.join(","), {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/livechat",
    maxAge: MERGE_PAGES_MAX_AGE,
  });

  redirect("/livechat");
}

export async function getMergePagesCookie(): Promise<string[]> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(MERGE_PAGES_COOKIE)?.value;
  if (!raw) return [];
  return raw.split(",").map((id) => id.trim()).filter(Boolean);
}
