import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ExternalLink, MessageSquare, ShoppingBag } from 'lucide-react';
import { DashboardNavbar } from '@/components/dashboard/DashboardNavbar';
import { CHANNEL_META } from '@/lib/bot-channel';
import { mockBots } from '@/lib/mock-bots';
import { verifySession } from '@/lib/dal';

interface BotDetailPageProps {
  params: Promise<{ botId: string }>;
}

export default async function BotDetailPage({ params }: BotDetailPageProps) {
  const user = await verifySession();
  const { botId } = await params;
  const bot = mockBots.find((b) => b.id === botId);

  if (!bot) {
    notFound();
  }

  const channel = CHANNEL_META[bot.channel];
  const ChannelIcon = channel.icon;

  return (
    <div className="min-h-screen bg-slate-100 font-roboto">
      <DashboardNavbar userName={user.name} userEmail={user.email} />

      <main className="mx-auto w-full max-w-3xl px-4 py-6 md:px-6">
        <Link
          href="/dashboard"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại danh sách
        </Link>

        <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-blue-500 text-2xl font-bold text-white">
                {bot.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900">{bot.name}</h1>
                <div className="mt-1 flex items-center gap-1.5 text-sm text-slate-400">
                  <ChannelIcon className={channel.badgeBg.replace('bg-', 'text-') + ' h-3.5 w-3.5'} />
                  <span className="font-mono">{bot.pageId}</span>
                  <a
                    href={bot.profileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-400 hover:text-primary"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </div>

            <span
              className={
                bot.isActive
                  ? 'rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600'
                  : 'rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-600'
              }
            >
              {bot.isActive ? 'Đang hoạt động' : 'Đã tắt'}
            </span>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 border-t border-slate-100 pt-6 sm:grid-cols-4">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <MessageSquare className="h-3.5 w-3.5" /> Tin nhắn
              </div>
              <p className="mt-1 text-lg font-bold text-slate-900">
                {bot.messageCount.toLocaleString('vi-VN')}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <ShoppingBag className="h-3.5 w-3.5" /> Đơn hàng
              </div>
              <p className="mt-1 text-lg font-bold text-slate-900">
                {bot.orderCount.toLocaleString('vi-VN')}
              </p>
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-slate-400">
          Trang cấu hình chi tiết cho bot này sẽ được bổ sung sau.
        </p>
      </main>
    </div>
  );
}
