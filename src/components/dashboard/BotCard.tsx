"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  BsExclamationCircleFill,
  BsThreeDotsVertical,
  BsPencilFill,
  BsTrashFill,
  BsArrowRepeat,
} from "react-icons/bs";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { CHANNEL_META } from "@/lib/bot-channel";
import { setMergePagesCookie } from "@/lib/mergePagesCookie";
import type { Bot } from "@/types/bot";
import { DisconnectBotModal } from "@/components/dashboard/DisconnectBotModal";

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
  onDisconnect: (id: string) => void;
  onReconnect: (id: string) => Promise<void>;
}

export function BotCard({ bot, index, onToggleActive, onDisconnect, onReconnect }: BotCardProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [confirmDisconnect, setConfirmDisconnect] = React.useState(false);
  const [reconnecting, setReconnecting] = React.useState(false);
  const [isNavigating, startNavigate] = React.useTransition();
  // Chỉ Zalo/Telegram có khái niệm "phiên sống" bị rớt cần làm mới —
  // Facebook chỉ có 1 access token thụ động, luôn sẵn sàng, không cần nút
  // này (xem facebook.controller.ts#reconnectPage).
  const canReconnect = bot.channel === "zalo" || bot.channel === "telegram";

  async function handleReconnect(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setMenuOpen(false);
    setReconnecting(true);
    await onReconnect(bot.id);
    setReconnecting(false);
  }
  const channel = CHANNEL_META[bot.channel];
  const ChannelIcon = channel.icon;
  const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];

  // Ghi cookie ngay ở client (đồng bộ, không qua mạng) rồi điều hướng thẳng —
  // trước đây đi qua 1 Server Action ghi cookie rồi tự redirect(), khiến MỌI
  // lượt bấm vào đây tốn thêm 1 vòng round-trip thừa (ghi cookie + redirect)
  // trước khi /livechat thật sự bắt đầu tải, đo được rõ trên production (log
  // request cho thấy 3 lượt fetch lại RSC dư thừa). Không dùng query string
  // vì lộ pageId trên URL nhìn rối mắt.
  function openInbox() {
    setMergePagesCookie([bot.id]);
    startNavigate(() => {
      router.push("/livechat");
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
          src={bot.avatarUrl || "/hchat.png"}
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

      {/* Góc phải: cảnh báo khi bị tắt (hoặc spinner lúc đang kết nối lại), hoặc menu ngữ cảnh khi hover */}
      <div className="absolute right-3 top-3">
        {reconnecting ? (
          <span
            className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary"
            title="Đang làm mới kết nối..."
          >
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          </span>
        ) : (
          bot.status !== "active" &&
          !menuOpen && (
            <span
              className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-amber-500 transition-opacity group-hover:opacity-0"
              title="Bot đang tắt"
            >
              <BsExclamationCircleFill className="h-3.5 w-3.5" />
            </span>
          )
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
          <BsThreeDotsVertical className="h-4 w-4" />
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
                <BsPencilFill className="h-3.5 w-3.5" /> Sửa
              </button>
              {canReconnect && (
                <button
                  type="button"
                  onClick={handleReconnect}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  <BsArrowRepeat className="h-3.5 w-3.5" /> Làm mới kết nối
                </button>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setMenuOpen(false);
                  setConfirmDisconnect(true);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer"
              >
                <BsTrashFill className="h-3.5 w-3.5" /> Ngắt kết nối
              </button>
            </div>
          </>
        )}
      </div>

      <DisconnectBotModal
        open={confirmDisconnect}
        onClose={() => setConfirmDisconnect(false)}
        onConfirm={() => onDisconnect(bot.id)}
        bot={bot}
        index={index}
      />
    </div>
  );
}
