import { BotDashboard } from '@/components/dashboard/BotDashboard';
import { getConnectedPages } from '@/lib/dal';

export default async function DashboardPage() {
  const connectedPages = await getConnectedPages();

  return <BotDashboard bots={connectedPages} />;
}
