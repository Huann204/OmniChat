import Link from "next/link";
import { BsTelephoneFill } from "react-icons/bs";
import { CHANNEL_META } from "@/lib/bot-channel";
import { formatTimeLabel } from "@/lib/message-format";
import { cn } from "@/lib/utils";
import type { CustomerItem } from "@/app/actions/customer";

// Khớp CHANNEL_TYPE_* trong server/src/models/connectedPage.model.ts — mirror
// đúng cách ConversationList.tsx đang làm (không có package dùng chung giữa
// 2 repo nên phải giữ đồng bộ thủ công).
const CHANNEL_META_BY_TYPE = {
  0: CHANNEL_META.facebook,
  1: CHANNEL_META.zalo,
  2: CHANNEL_META.telegram,
} as const;

const AVATAR_COLORS = [
  "bg-blue-500",
  "bg-violet-500",
  "bg-amber-500",
  "bg-emerald-500",
  "bg-pink-500",
  "bg-indigo-500",
  "bg-lime-600",
];

interface PageInfo {
  name: string;
  avatarUrl?: string;
}

export function CustomerList({
  items,
  pagesById,
}: {
  items: CustomerItem[];
  pagesById: Record<string, PageInfo>;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-400">
        Chưa có khách hàng nào.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      {items.map((item, index) => {
        const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];
        // Page GỐC lúc tạo hồ sơ (item.pageId/type) — ổn định, dùng cho badge
        // chính. Hội thoại MỚI NHẤT (mảng đã sort mới nhất trước, xem
        // customer.controller.ts) chỉ dùng để hiện "nhắn gần nhất lúc nào" +
        // đếm có đang gắn thêm kênh nào khác không.
        const channelMeta = CHANNEL_META_BY_TYPE[item.type as keyof typeof CHANNEL_META_BY_TYPE];
        const page = pagesById[item.pageId];
        const latest = item.conversations[0];
        const extraChannelCount = item.conversations.filter((c) => c.pageId !== item.pageId).length;

        return (
          <Link
            key={item.id}
            href={`/customers/${item.id}`}
            className={cn(
              "flex items-center gap-3 border-b border-slate-100 px-4 py-3 transition-colors last:border-b-0 hover:bg-slate-50"
            )}
          >
            <div className="relative shrink-0">
              {item.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.avatarUrl}
                  alt={item.name}
                  className="h-11 w-11 rounded-full object-cover"
                />
              ) : (
                <span
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold text-white",
                    avatarColor
                  )}
                >
                  {item.name.charAt(0).toUpperCase()}
                </span>
              )}
              {channelMeta && (
                <channelMeta.icon className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full object-cover ring-2 ring-white" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">{item.name}</p>
              {item.phone ? (
                <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                  <BsTelephoneFill className="h-3 w-3 shrink-0" />
                  {item.phone}
                </p>
              ) : (
                <p className="mt-0.5 text-xs text-slate-400">Chưa có số điện thoại</p>
              )}
              {page && (
                <div className="mt-1 flex items-center gap-1.5">
                  {page.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={page.avatarUrl}
                      alt={page.name}
                      className="h-4 w-4 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-slate-300 text-[9px] font-bold text-white">
                      {page.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <span className="truncate text-[11px] text-slate-400 max-w-[140px]">
                    {page.name}
                  </span>
                  {extraChannelCount > 0 && (
                    <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                      +{extraChannelCount} kênh khác
                    </span>
                  )}
                </div>
              )}
            </div>

            {latest && (
              <span className="shrink-0 text-xs text-slate-400">
                {formatTimeLabel(latest.lastMessageAt)}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
