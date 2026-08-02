"use client";

import * as React from "react";
import { AlertCircle, Loader2, MoreVertical, Pencil, Power, Trash2 } from "lucide-react";
import { setMergePagesCookie } from "@/app/actions/mergeView";
import { cn } from "@/lib/utils";
import { CHANNEL_META } from "@/lib/bot-channel";
import { loadingBar } from "@/store/loading-bar-store";
import type { Bot } from "@/types/bot";

const AVATAR_COLORS = [
  "bg-blue-500",
  "bg-violet-500",
  "bg-amber-500",
  "bg-emerald-500",
  "bg-pink-500",
  "bg-indigo-500",
  "bg-lime-600",
  "bg-sky-500",
];

interface BotCardProps {
  bot: Bot;
  index: number;
  onToggleActive: (id: string) => void;
}

export function BotCard({ bot, index, onToggleActive }: BotCardProps) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [isNavigating, startNavigate] = React.useTransition();
  const channel = CHANNEL_META[bot.channel];
  const ChannelIcon = channel.icon;
  const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];

  // Dùng chung cơ chế với "gộp trang" — chỉ khác là gộp đúng 1 Page — để
  // luôn qua /livechat, không lộ id qua URL. Action tự redirect() sau khi
  // ghi cookie — KHÔNG tự router.push ở đây nữa: gọi router.push ngay sau
  // 1 Server Action có mutate cookie khiến Next.js xử lý thành 2 lượt điều
  // hướng chồng nhau cho cùng 1 lần bấm (đã xác nhận bằng log request).
  function openInbox() {
    startNavigate(async () => {
      loadingBar.start();
      try {
        await setMergePagesCookie([bot.id]);
      } finally {
        loadingBar.done();
      }
    });
  }

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={openInbox}
      onKeyDown={(e) => {
        if (e.key === "Enter") openInbox();
      }}
      className="group relative flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white p-2 h-[84px] transition-all duration-150 hover:border-slate-300 hover:shadow-md cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
    >
      {isNavigating && (
        <div className="absolute inset-0 z-30 flex items-center justify-center rounded-xl bg-white/70">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      )}
      <div
        className={cn(
          "flex h-16 w-16 shrink-0 items-center justify-center rounded-xl text-lg font-bold text-white",
          avatarColor
        )}
      >
        <img
          src={bot.avatarUrl || "https://content.pancake.vn/2.1-2606/avatars/22b81c977849d009c6c17d772526a37f02902174"}
          alt={bot.name}
          className="h-full w-full object-cover rounded-[6px]"
        />
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="truncate text-[14px] font-medium text-slate-900" title={bot.name}>
          {bot.name}
        </h3>
        <div className="mt-1 flex items-center gap-1.5 text-sm text-slate-400">
          <ChannelIcon className={cn("h-4 w-4 shrink-0", channel.badgeBg.replace("bg-", "text-"))} />
          <span className="truncate text-[12px] text-[#667085]">{bot.pageId}</span>
        </div>
      </div>

      {/* Góc phải: cảnh báo khi bị tắt, hoặc menu ngữ cảnh khi hover */}
      <div className="absolute right-3 top-3">
        {!bot.isActive && !menuOpen && (
          <span
            className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-amber-500 transition-opacity group-hover:opacity-0"
            title="Bot đang tắt"
          >
            <AlertCircle className="h-3.5 w-3.5" />
          </span>
        )}

        <button
          type="button"
          aria-label="Mở menu tuỳ chọn"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setMenuOpen((v) => !v);
          }}
          className={cn(
            "absolute right-0 top-0 flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition-opacity hover:bg-slate-100 hover:text-slate-700 cursor-pointer",
            menuOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
          )}
        >
          <MoreVertical className="h-4 w-4" />
        </button>

        {menuOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setMenuOpen(false);
              }}
            />
            <div className="absolute right-0 z-20 mt-8 w-40 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setMenuOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                <Pencil className="h-3.5 w-3.5" /> Sửa
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onToggleActive(bot.id);
                  setMenuOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                <Power className="h-3.5 w-3.5" /> {bot.isActive ? "Tắt bot" : "Bật bot"}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setMenuOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" /> Xoá
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
