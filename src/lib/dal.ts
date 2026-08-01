import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { apiFetch } from "./api";
import { getSessionToken } from "./session";
import type { Bot } from "@/types/bot";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
}

export const getUser = cache(async (): Promise<SessionUser | null> => {
  const token = await getSessionToken();
  if (!token) return null;

  try {
    const data = await apiFetch<{ success: boolean; user: SessionUser }>(
      "/auth/me",
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return data.user;
  } catch {
    return null;
  }
});

export const verifySession = cache(async (): Promise<SessionUser> => {
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }
  return user;
});

interface ConnectedPageRaw {
  id: string;
  type: number;
  pageId: string;
  name: string;
  category?: string;
  picture?: string;
  active: boolean;
}

// Chỉ có Facebook (type = 0) hiện tại — map sang Bot để dùng chung UI với
// mock data trong lúc chưa có nguồn dữ liệu bot thật cho các kênh khác.
export const getConnectedPages = cache(async (): Promise<Bot[]> => {
  const token = await getSessionToken();
  if (!token) return [];

  try {
    const data = await apiFetch<{ success: boolean; pages: ConnectedPageRaw[] }>(
      "/facebook/pages/connected",
      { headers: { Authorization: `Bearer ${token}` } }
    );

    return data.pages.map((p) => ({
      id: p.id,
      pageId: p.pageId,
      name: p.name,
      channel: "facebook" as const,
      profileUrl: `https://facebook.com/${p.pageId}`,
      isActive: p.active,
      messageCount: 0,
      orderCount: 0,
      avatarUrl: p.picture,
    }));
  } catch {
    return [];
  }
});
