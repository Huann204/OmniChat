"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { BsX } from "react-icons/bs";
import { AlertTriangle, MessageSquareOff, AlertOctagon, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { CHANNEL_META } from "@/lib/bot-channel";
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

interface DisconnectBotModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  bot: Bot;
  index?: number;
}

function subscribe() {
  return () => {};
}
function getClientSnapshot() {
  return true;
}
function getServerSnapshot() {
  return false;
}

export function DisconnectBotModal({
  open,
  onClose,
  onConfirm,
  bot,
  index = 0,
}: DisconnectBotModalProps) {
  const mounted = React.useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);

  React.useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!mounted) return null;

  const channel = CHANNEL_META[bot.channel];
  const ChannelIcon = channel?.icon;
  const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          {/* Overlay Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={onClose}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            role="dialog"
            aria-modal="true"
            aria-label={`Ngắt kết nối ${bot.name}`}
            className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng"
              className="absolute right-3.5 top-3.5 z-10 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <BsX className="h-5 w-5" />
            </button>

            <div className="p-6 pb-5">
              {/* Header Badge & Title */}
              <div className="flex items-start gap-3.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 shadow-xs">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div className="pt-0.5 min-w-0 flex-1">
                  <h3 className="text-lg font-bold text-slate-900 leading-snug truncate" title={`Ngắt kết nối "${bot.name}"?`}>
                    Ngắt kết nối &quot;{bot.name}&quot;?
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Xác nhận hủy liên kết page khỏi hệ thống.
                  </p>
                </div>
              </div>

              {/* Bot Information Card */}
              <div className="mt-4 flex items-center gap-3 rounded-xl border border-slate-200/80 bg-slate-50/70 p-3">
                <div
                  className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg font-bold text-white text-base shadow-xs",
                    avatarColor
                  )}
                >
                  <img
                    src={bot.avatarUrl || "/hchat.png"}
                    alt={bot.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold text-slate-900" title={bot.name}>
                      {bot.name}
                    </span>
                    {channel?.label && (
                      <span className="inline-flex shrink-0 items-center rounded-full bg-slate-200/60 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                        {channel.label}
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                    {ChannelIcon && (
                      <ChannelIcon className={cn("h-3.5 w-3.5 shrink-0", channel.badgeBg.replace("bg-", "text-"))} />
                    )}
                    <span className="truncate text-[11px] text-slate-500">{bot.pageId}</span>
                  </div>
                </div>
              </div>

              {/* Key Impact Points */}
              <div className="mt-4 space-y-2.5 rounded-xl border border-rose-100 bg-rose-50/50 p-3.5 text-xs">
                <div className="flex items-start gap-2.5 text-slate-700">
                  <MessageSquareOff className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                  <span>
                    <strong className="font-semibold text-slate-900">Trạng thái:</strong> Page sẽ không còn nhận/gửi tin nhắn được nữa.
                  </span>
                </div>
                <div className="flex items-start gap-2.5 text-rose-700">
                  <AlertOctagon className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                  <span className="font-medium">
                    Thao tác này <strong className="font-bold underline decoration-rose-300">không thể hoàn tác</strong>.
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 bg-slate-50/80 px-6 py-3.5 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="cursor-pointer rounded-xl border border-slate-200/80 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 active:scale-[0.98]"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onConfirm();
                }}
                className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-rose-600 px-4.5 py-2 text-xs font-semibold text-white shadow-xs transition-all hover:bg-rose-700 active:scale-[0.98]"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Ngắt kết nối
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
