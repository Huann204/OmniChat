"use server";

import { cookies } from "next/headers";

const MERGE_PAGES_COOKIE = "merge_pages";
const MERGE_PAGES_MAX_AGE = 60 * 60 * 24; // 1 ngày — đủ để thoát ra rồi quay lại /livechat trong ngày mà không phải gộp lại.

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
}

export async function getMergePagesCookie(): Promise<string[]> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(MERGE_PAGES_COOKIE)?.value;
  if (!raw) return [];
  return raw.split(",").map((id) => id.trim()).filter(Boolean);
}
