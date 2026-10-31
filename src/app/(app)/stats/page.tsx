import type { Metadata } from "next";
import { StatsView } from "@/components/stats/StatsView";
import { getConnectedPages, getCurrentShopRole, getShopMembers, getStats, verifySession } from "@/lib/dal";

export const metadata: Metadata = { title: "Thống kê" };

export default async function StatsPage() {
  const [initialStats, pages, members, myRole, user] = await Promise.all([
    getStats({ days: 7 }),
    getConnectedPages(),
    getShopMembers(),
    getCurrentShopRole(),
    verifySession(),
  ]);

  return (
    <StatsView
      initialStats={initialStats}
      pages={pages.map((p) => ({ id: p.id, name: p.name }))}
      members={members}
      myUserId={user.id}
      // Chủ Shop/quản trị viên xem cả đội; nhân viên thường chỉ thấy số của mình
      // (server cũng lọc, xem stats.controller.ts).
      canSeeTeam={myRole === "owner" || myRole === "admin"}
    />
  );
}
