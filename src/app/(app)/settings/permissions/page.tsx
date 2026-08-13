import type { Metadata } from "next";
import { TeamMemberManager } from "@/components/settings/TeamMemberManager";

export const metadata: Metadata = {
  title: "Phân quyền",
};
import { getConnectedPages, getCurrentShopRole, getShopMembers, verifySession } from "@/lib/dal";

export default async function PermissionsSettingsPage() {
  const [user, members, myRole, connectedPages] = await Promise.all([
    verifySession(),
    getShopMembers(),
    getCurrentShopRole(),
    getConnectedPages(),
  ]);
  return (
    <TeamMemberManager
      initialMembers={members}
      myRole={myRole}
      myUserId={user.id}
      connectedPages={connectedPages}
    />
  );
}
