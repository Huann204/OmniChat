"use server";

import { apiFetch } from "@/lib/api";
import { buildStatsQuery } from "@/lib/dal";
import { getCurrentShopId, getSessionToken } from "@/lib/session";
import type { Stats, StatsParams } from "@/types/stats";

export async function fetchStats(params?: StatsParams): Promise<Stats | null> {
  const token = await getSessionToken();
  if (!token) return null;

  try {
    const shopId = await getCurrentShopId();
    const data = await apiFetch<{ success: boolean } & Stats>(
      `/stats${buildStatsQuery(params)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          ...(shopId ? { "X-Shop-Id": shopId } : {}),
        },
      }
    );
    return data;
  } catch {
    return null;
  }
}
