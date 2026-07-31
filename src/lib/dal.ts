import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { apiFetch } from "./api";
import { getSessionToken } from "./session";

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
