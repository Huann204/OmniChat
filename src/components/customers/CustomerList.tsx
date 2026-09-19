"use client";

import * as React from "react";
import { Loader2, Search } from "lucide-react";
import { fetchCustomers } from "@/app/actions/customer";
import { CHANNEL_META } from "@/lib/bot-channel";
import { cn } from "@/lib/utils";
import { formatTimeLabel } from "@/lib/message-format";
import type { Customer } from "@/types/customer";
import type { ConversationTag } from "@/types/conversationTag";
import { CustomerDetailModal } from "./CustomerDetailModal";

// Khớp CHANNEL_TYPE_* trong server/src/models/connectedPage.model.ts — mirror
// cách ConversationList.tsx đã làm (local, không export dùng chung — bảng
// này quá nhỏ, không đáng tách file riêng).
const CHANNEL_META_BY_TYPE = {
  0: CHANNEL_META.facebook,
  1: CHANNEL_META.zalo,
  2: CHANNEL_META.telegram,
  3: CHANNEL_META.website,
} as const;

const CHANNEL_FILTER_OPTIONS = [
  { label: "Tất cả kênh", value: undefined },
  { label: "Facebook", value: 0 },
  { label: "Zalo", value: 1 },
  { label: "Telegram", value: 2 },
  { label: "Website", value: 3 },
];

interface CustomerListProps {
  initialCustomers: Customer[];
  initialHasMore: boolean;
  allTags: ConversationTag[];
}

export function CustomerList({ initialCustomers, initialHasMore, allTags }: CustomerListProps) {
  const [customers, setCustomers] = React.useState(initialCustomers);
  const [hasMore, setHasMore] = React.useState(initialHasMore);
  const [search, setSearch] = React.useState("");
  const [channelType, setChannelType] = React.useState<number | undefined>(undefined);
  const [tagId, setTagId] = React.useState<string | undefined>(undefined);
  const [loading, setLoading] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [selected, setSelected] = React.useState<Customer | null>(null);
  const requestSeqRef = React.useRef(0);

  // Đổi search/channelType/tagId -> tải lại TỪ ĐẦU (không phải tải thêm) —
  // debounce riêng cho search (gõ tự do), đổi bộ lọc dropdown thì tải lại
  // ngay lập tức.
  React.useEffect(() => {
    const requestId = ++requestSeqRef.current;
    const delay = search ? 350 : 0;
    const timer = setTimeout(async () => {
      setLoading(true);
      const result = await fetchCustomers({ q: search.trim() || undefined, type: channelType, tagId });
      if (requestSeqRef.current !== requestId) return; // có lượt gõ/lọc mới hơn, bỏ kết quả cũ
      setCustomers(result.customers);
      setHasMore(result.hasMore);
      setLoading(false);
    }, delay);
    return () => clearTimeout(timer);
  }, [search, channelType, tagId]);

  async function handleLoadMore() {
    if (customers.length === 0 || loadingMore) return;
    const last = customers[customers.length - 1];
    setLoadingMore(true);
    const result = await fetchCustomers({
      q: search.trim() || undefined,
      type: channelType,
      tagId,
      before: last.lastMessageAt,
      beforeId: last.id,
    });
    setCustomers((prev) => [...prev, ...result.customers]);
    setHasMore(result.hasMore);
    setLoadingMore(false);
  }

  return (
    <main className="w-full flex-1 min-h-0 bg-slate-100 pt-6 pb-6 shadow-2xl relative overflow-y-auto">
      <div className="mx-auto flex h-full w-[calc(100%-2rem)] max-w-[1144px] flex-col space-y-2 sm:w-[calc(100%-3rem)]">
        <div className="shrink-0 rounded-2xl border border-slate-200/70 bg-white p-4 shadow-[8px] md:p-5">
          <h1 className="mb-4 text-base font-semibold text-slate-900">Khách hàng</h1>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo tên khách hàng..."
                className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <select
              value={channelType ?? ""}
              onChange={(e) => setChannelType(e.target.value === "" ? undefined : Number(e.target.value))}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              {CHANNEL_FILTER_OPTIONS.map((opt) => (
                <option key={opt.label} value={opt.value ?? ""}>
                  {opt.label}
                </option>
              ))}
            </select>
            <select
              value={tagId ?? ""}
              onChange={(e) => setTagId(e.target.value === "" ? undefined : e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="">Tất cả thẻ</option>
              {allTags.map((tag) => (
                <option key={tag.id} value={tag.id}>
                  {tag.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-[8px]">
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
              </div>
            ) : customers.length === 0 ? (
              <p className="py-16 text-center text-sm text-slate-400">
                Không tìm thấy khách hàng nào khớp với bộ lọc hiện tại.
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Khách hàng</th>
                    <th className="px-4 py-3">Kênh</th>
                    <th className="px-4 py-3">Tin nhắn gần nhất</th>
                    <th className="px-4 py-3">Thẻ</th>
                    <th className="px-4 py-3">Thời gian</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => {
                    const channel = CHANNEL_META_BY_TYPE[customer.type as keyof typeof CHANNEL_META_BY_TYPE];
                    const ChannelIcon = channel?.icon;
                    return (
                      <tr
                        key={customer.id}
                        onClick={() => setSelected(customer)}
                        className="cursor-pointer border-t border-slate-100 transition-colors hover:bg-slate-50"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            {customer.customerAvatarUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={customer.customerAvatarUrl}
                                alt={customer.customerName}
                                className="h-8 w-8 shrink-0 rounded-full object-cover"
                              />
                            ) : (
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-300 text-xs font-bold text-white">
                                {customer.customerName.charAt(0).toUpperCase()}
                              </span>
                            )}
                            <span className="min-w-0 truncate font-medium text-slate-800">
                              {customer.customerName}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {channel && (
                            <span
                              className={cn(
                                "inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[11px] font-medium",
                                channel.badgeBg,
                                channel.badgeText
                              )}
                            >
                              {ChannelIcon && <ChannelIcon className="h-3 w-3" />}
                              {channel.label}
                            </span>
                          )}
                        </td>
                        <td className="max-w-[260px] truncate px-4 py-3 text-slate-500">
                          {customer.lastMessage || "—"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {customer.tags.map((tag) => (
                              <span
                                key={tag.id}
                                className="rounded-full px-2 py-0.5 text-[11px] font-medium text-white"
                                style={{ background: tag.color }}
                              >
                                {tag.label}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-400">
                          {formatTimeLabel(customer.lastMessageAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {hasMore && !loading && (
            <div className="shrink-0 border-t border-slate-100 p-3 text-center">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-sm font-medium text-primary hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingMore && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Tải thêm
              </button>
            </div>
          )}
        </div>
      </div>

      {selected && (
        <CustomerDetailModal
          customer={selected}
          allTags={allTags}
          onClose={() => setSelected(null)}
          onTagsChange={(tags) => {
            setCustomers((prev) => prev.map((c) => (c.id === selected.id ? { ...c, tags } : c)));
            setSelected((prev) => (prev ? { ...prev, tags } : prev));
          }}
        />
      )}
    </main>
  );
}
