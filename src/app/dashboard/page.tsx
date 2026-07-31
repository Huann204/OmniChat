import { LogoutButton } from '@/components/auth/LogoutButton';
import { verifySession } from '@/lib/dal';

export default async function DashboardPage() {
  const user = await verifySession();

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 pt-32 min-h-screen">
      <h1 className="text-2xl font-bold text-slate-900">Xin chào, {user.name}</h1>
      <p className="text-slate-500">{user.email}</p>
      <LogoutButton variant="outline" />
    </div>
  );
}
