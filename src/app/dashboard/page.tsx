import { BotDashboard } from '@/components/dashboard/BotDashboard';
import { getConnectedPages, getCurrentShopRole, verifySession } from '@/lib/dal';

export default async function DashboardPage() {
  const [user, connectedPages, myRole] = await Promise.all([
    verifySession(),
    getConnectedPages(),
    getCurrentShopRole(),
  ]);

  return (
    <BotDashboard
      bots={connectedPages}
      userName={user.name}
      userEmail={user.email}
      myRole={myRole}
    />
  );
}
