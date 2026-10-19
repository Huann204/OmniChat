import type { Metadata } from "next";
import { StatsView } from "@/components/stats/StatsView";
import { getConnectedPages, getStats } from "@/lib/dal";

export const metadata: Metadata = { title: "Thống kê" };

export default async function StatsPage() {
  const [initialStats, pages] = await Promise.all([getStats({ days: 7 }), getConnectedPages()]);

  return (
    <StatsView
      initialStats={initialStats}
      pages={pages.map((p) => ({ id: p.id, name: p.name }))}
    />
  );
}
