"use client";

import * as React from "react";
import { ArrowDownRight, ArrowUpRight, Loader2, Printer } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fetchStats } from "@/app/actions/stats";
import { cn } from "@/lib/utils";
import type { Stats, StatsComparison, StatsParams } from "@/types/stats";

const RANGE_OPTIONS = [
  { label: "Hôm nay", days: 1 },
  { label: "7 ngày", days: 7 },
  { label: "30 ngày", days: 30 },
];

const CHANNEL_FILTER_OPTIONS = [
  { label: "Tất cả kênh", value: undefined },
  { label: "Facebook", value: 0 },
  { label: "Zalo", value: 1 },
  { label: "Telegram", value: 2 },
  { label: "Website", value: 3 },
];

// Khớp CHANNEL_TYPE_* trong server/src/models/connectedPage.model.ts. Màu chọn
// để 4 kênh phân biệt được với nhau trên biểu đồ (không dùng đúng màu thương
// hiệu vì Facebook và Zalo cùng tông xanh dương, nhìn không tách được).
const CHANNEL_CHART_META: Record<number, { label: string; color: string }> = {
  0: { label: "Facebook", color: "#1877F2" },
  1: { label: "Zalo", color: "#06b6d4" },
  2: { label: "Telegram", color: "#8b5cf6" },
  3: { label: "Website", color: "#475569" },
};

const CUSTOMER_COLOR = "#2563eb";
const PAGE_COLOR = "#10b981";

function formatDuration(seconds: number | null): string {
  if (seconds === null) return "—";
  if (seconds < 60) return `${Math.round(seconds)} giây`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} phút`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours < 24) return rest ? `${hours} giờ ${rest} phút` : `${hours} giờ`;
  const days = Math.floor(hours / 24);
  const restHours = hours % 24;
  return restHours ? `${days} ngày ${restHours} giờ` : `${days} ngày`;
}

function Delta({ value }: { value: StatsComparison }) {
  if (value.previous === 0) {
    return <span className="text-xs text-slate-400">Kỳ trước: 0</span>;
  }
  const percent = Math.round(((value.current - value.previous) / value.previous) * 100);
  if (percent === 0) {
    return <span className="text-xs text-slate-400">Không đổi so với kỳ trước</span>;
  }
  const up = percent > 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-xs font-medium",
        up ? "text-emerald-600" : "text-rose-600"
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {Math.abs(percent)}% so với kỳ trước
    </span>
  );
}

function StatCard({
  title,
  value,
  footer,
}: {
  title: string;
  value: string;
  footer: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white p-4">
      <p className="text-xs font-medium text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
      <div className="mt-1.5 min-h-4">{footer}</div>
    </div>
  );
}

function ChartCard({
  title,
  className,
  children,
}: {
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200/70 bg-white p-4 md:p-5 print:break-inside-avoid",
        className
      )}
    >
      <h2 className="mb-4 text-sm font-semibold text-slate-900">{title}</h2>
      {children}
    </div>
  );
}

const tooltipStyle = {
  borderRadius: 12,
  border: "1px solid #e2e8f0",
  fontSize: 12,
  boxShadow: "0 4px 16px rgba(15,23,42,.08)",
};

interface StatsViewProps {
  initialStats: Stats | null;
  pages: { id: string; name: string }[];
}

export function StatsView({ initialStats, pages }: StatsViewProps) {
  const [stats, setStats] = React.useState(initialStats);
  const [days, setDays] = React.useState(7);
  const [channelType, setChannelType] = React.useState<number | undefined>(undefined);
  const [pageId, setPageId] = React.useState<string | undefined>(undefined);
  const [loading, setLoading] = React.useState(false);
  const requestSeqRef = React.useRef(0);

  async function reload(next: StatsParams) {
    const requestId = ++requestSeqRef.current;
    setLoading(true);
    const result = await fetchStats(next);
    if (requestSeqRef.current !== requestId) return; // có lần đổi bộ lọc mới hơn, bỏ kết quả cũ
    if (result) setStats(result);
    setLoading(false);
  }

  function handleDaysChange(nextDays: number) {
    setDays(nextDays);
    void reload({ days: nextDays, type: channelType, pageId });
  }

  function handleChannelChange(nextType: number | undefined) {
    setChannelType(nextType);
    void reload({ days, type: nextType, pageId });
  }

  function handlePageChange(nextPageId: string | undefined) {
    setPageId(nextPageId);
    void reload({ days, type: channelType, pageId: nextPageId });
  }

  const channelData = (stats?.byChannel ?? [])
    .filter((c) => CHANNEL_CHART_META[c.type])
    .map((c) => ({
      type: c.type,
      name: CHANNEL_CHART_META[c.type].label,
      color: CHANNEL_CHART_META[c.type].color,
      conversations: c.conversations,
    }))
    .sort((a, b) => b.conversations - a.conversations);

  return (
    <main className="w-full flex-1 min-h-0 bg-slate-100 pt-6 pb-6 shadow-2xl relative overflow-y-auto print:overflow-visible print:bg-white print:p-0 print:shadow-none">
      <div className="mx-auto w-[calc(100%-2rem)] max-w-[1144px] space-y-3 sm:w-[calc(100%-3rem)] print:w-full print:max-w-none">
        <div className="rounded-2xl border border-slate-200/70 bg-white p-4 md:p-5 print:border-0 print:p-0">
          <div className="mb-4 flex items-center gap-2">
            <h1 className="text-base font-semibold text-slate-900">Thống kê</h1>
            {loading && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
            <button
              type="button"
              onClick={() => window.print()}
              className="ml-auto inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 print:hidden"
            >
              <Printer className="h-4 w-4" />
              In báo cáo
            </button>
          </div>
          <p suppressHydrationWarning className="hidden text-sm text-slate-500 print:block">
            {RANGE_OPTIONS.find((o) => o.days === days)?.label}
            {channelType !== undefined &&
              ` · ${CHANNEL_FILTER_OPTIONS.find((o) => o.value === channelType)?.label}`}
            {pageId && ` · ${pages.find((p) => p.id === pageId)?.name ?? ""}`}
            {" · "}Xuất lúc {new Date().toLocaleString("vi-VN")}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row print:hidden">
            <div className="inline-flex rounded-lg border border-slate-200 p-0.5">
              {RANGE_OPTIONS.map((opt) => (
                <button
                  key={opt.days}
                  type="button"
                  onClick={() => handleDaysChange(opt.days)}
                  className={cn(
                    "flex-1 cursor-pointer rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors sm:flex-none",
                    days === opt.days
                      ? "bg-primary text-white"
                      : "text-slate-600 hover:bg-slate-50"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <select
              value={channelType ?? ""}
              onChange={(e) =>
                handleChannelChange(e.target.value === "" ? undefined : Number(e.target.value))
              }
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              {CHANNEL_FILTER_OPTIONS.map((opt) => (
                <option key={opt.label} value={opt.value ?? ""}>
                  {opt.label}
                </option>
              ))}
            </select>
            <select
              value={pageId ?? ""}
              onChange={(e) => handlePageChange(e.target.value === "" ? undefined : e.target.value)}
              className="min-w-0 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="">Tất cả Page</option>
              {pages.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {!stats ? (
          <div className="rounded-2xl border border-slate-200/70 bg-white py-16 text-center text-sm text-slate-400">
            Không tải được số liệu thống kê. Thử tải lại trang.
          </div>
        ) : (
          <div className={cn("space-y-3 transition-opacity", loading && "opacity-60")}>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
              <StatCard
                title="Hội thoại mới"
                value={stats.overview.newConversations.current.toLocaleString("vi-VN")}
                footer={<Delta value={stats.overview.newConversations} />}
              />
              <StatCard
                title="Tin khách gửi"
                value={stats.overview.customerMessages.current.toLocaleString("vi-VN")}
                footer={<Delta value={stats.overview.customerMessages} />}
              />
              <StatCard
                title="Tin đã trả lời"
                value={stats.overview.pageMessages.current.toLocaleString("vi-VN")}
                footer={
                  <span className="text-xs text-slate-400">
                    Trong đó bot: {stats.overview.pageMessages.bot.toLocaleString("vi-VN")}
                  </span>
                }
              />
              <StatCard
                title="Phản hồi đầu tiên (TB)"
                value={formatDuration(stats.firstResponse.avgSeconds)}
                footer={
                  <span className="text-xs text-slate-400">
                    {stats.firstResponse.sampleCount > 0
                      ? `Trung vị ${formatDuration(stats.firstResponse.medianSeconds)} · ${stats.firstResponse.sampleCount} hội thoại`
                      : "Chưa có hội thoại mới được trả lời"}
                  </span>
                }
              />
              <StatCard
                title="Chưa đọc hiện tại"
                value={stats.overview.unreadConversations.toLocaleString("vi-VN")}
                footer={<span className="text-xs text-slate-400">Hội thoại</span>}
              />
            </div>

            <ChartCard title="Tin nhắn theo thời gian">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.series} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 12, fill: "#94a3b8" }}
                      tickLine={false}
                      axisLine={false}
                      interval="preserveStartEnd"
                      minTickGap={16}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 12, fill: "#94a3b8" }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                    <Line
                      type="monotone"
                      dataKey="customerMessages"
                      name="Khách gửi"
                      stroke={CUSTOMER_COLOR}
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="pageMessages"
                      name="Đã trả lời"
                      stroke={PAGE_COLOR}
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            <div className="grid gap-3 lg:grid-cols-2">
              <ChartCard title="Hội thoại mới theo thời gian">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.series} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 12, fill: "#94a3b8" }}
                        tickLine={false}
                        axisLine={false}
                        interval="preserveStartEnd"
                        minTickGap={16}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 12, fill: "#94a3b8" }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#f1f5f9" }} />
                      <Bar
                        dataKey="newConversations"
                        name="Hội thoại mới"
                        fill={CUSTOMER_COLOR}
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>

              <ChartCard title="Hội thoại hoạt động theo kênh">
                {channelData.length === 0 ? (
                  <p className="flex h-64 items-center justify-center text-sm text-slate-400">
                    Chưa có hội thoại nào hoạt động trong kỳ này.
                  </p>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={channelData}
                        layout="vertical"
                        margin={{ top: 4, right: 16, bottom: 0, left: 8 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                        <XAxis
                          type="number"
                          allowDecimals={false}
                          tick={{ fontSize: 12, fill: "#94a3b8" }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          width={72}
                          tick={{ fontSize: 12, fill: "#475569" }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#f1f5f9" }} />
                        <Bar dataKey="conversations" name="Hội thoại" radius={[0, 4, 4, 0]}>
                          {channelData.map((c) => (
                            <Cell key={c.type} fill={c.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </ChartCard>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
