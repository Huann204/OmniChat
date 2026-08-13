import type { Metadata } from 'next';
import { BotDashboard } from '@/components/dashboard/BotDashboard';
import { getConnectedPages } from '@/lib/dal';

export const metadata: Metadata = {
  title: 'Tổng quan',
};

export default async function DashboardPage() {
  const connectedPages = await getConnectedPages();

  return <BotDashboard bots={connectedPages} />;
}
