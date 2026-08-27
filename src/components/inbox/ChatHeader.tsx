"use client";

import {
  BsArrowLeft,
  BsLink45Deg,
  BsFillClockFill,
  BsFillEmojiSmileFill,
  BsFillPeopleFill,
  BsFillFolderFill,
  BsFillEnvelopeFill,
  BsThreeDots,
  BsLayoutSidebarReverse,
} from "react-icons/bs";
import { cn } from "@/lib/utils";
import type { Conversation } from "@/types/conversation";

interface ChatHeaderProps {
  conversation: Conversation;
  onBack?: () => void;
  onToggleCustomerInfo?: () => void;
  showCustomerInfo?: boolean;
}

const HEADER_AVATAR_COLORS: Record<string, string> = {};

function avatarColorFor(name: string) {
  const colors = ["bg-blue-500", "bg-violet-500", "bg-amber-500", "bg-emerald-500", "bg-pink-500"];
  if (!HEADER_AVATAR_COLORS[name]) {
    HEADER_AVATAR_COLORS[name] = colors[name.length % colors.length];
  }
  return HEADER_AVATAR_COLORS[name];
}

export function ChatHeader({
  conversation,
  onBack,
  onToggleCustomerInfo,
  showCustomerInfo,
}: ChatHeaderProps) {
  const lastMessage = conversation.messages[conversation.messages.length - 1];

  return (
    <div className="flex items-center justify-between border-b border-slate-200 bg-white px-3 py-2.5 sm:px-4">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="Quay lại danh sách hội thoại"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-slate-100 md:hidden cursor-pointer -ml-1"
          >
            <BsArrowLeft className="h-5 w-5" />
          </button>
        )}
        {conversation.customerAvatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={conversation.customerAvatarUrl}
            alt={conversation.customerName}
            className="h-10 w-10 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${avatarColorFor(
              conversation.customerName
            )}`}
          >
            {conversation.customerName.charAt(0).toUpperCase()}
          </span>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h2 className="truncate text-sm font-semibold text-slate-900">{conversation.customerName}</h2>
            {conversation.botActive && conversation.botPaused && (
              <span
                title="Tạm dừng 30 phút"
                className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 ring-1 ring-inset ring-amber-200"
              >
                ⏸️ AI tạm dừng
              </span>
            )}
            {conversation.botActive && !conversation.botPaused && (
              <span
                title="Bot đang tự động trả lời hội thoại này (Cài đặt > Trợ lý AI > Chatbot tự động)"
                className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200"
              >
                🤖 AI đang bật
              </span>
            )}
          </div>
          <p className="truncate text-xs text-slate-400">
            {conversation.lastSeenLabel}
            {lastMessage?.time ? ` • ${lastMessage.time}` : ""}
          </p>
          <div className="mt-0.5 flex items-center gap-2 text-slate-400">
            <BsLink45Deg className="h-3.5 w-3.5" />
            <BsFillClockFill className="h-3.5 w-3.5" />
            <BsFillEmojiSmileFill className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1 text-slate-400">
        {[BsFillPeopleFill, BsFillFolderFill, BsFillEnvelopeFill].map((Icon, i) => (
          <button
            key={i}
            type="button"
            className="hidden sm:flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
        {onToggleCustomerInfo && (
          <button
            type="button"
            onClick={onToggleCustomerInfo}
            title="Thông tin khách hàng / Tạo đơn"
            aria-label="Thông tin khách hàng / Tạo đơn"
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full transition-colors cursor-pointer md:hidden",
              showCustomerInfo ? "bg-primary/10 text-primary" : "hover:bg-slate-100 hover:text-slate-700"
            )}
          >
            <BsLayoutSidebarReverse className="h-4 w-4" />
          </button>
        )}
        <span className="mx-0.5 sm:mx-1 h-5 w-px bg-slate-200" />
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
        >
          <BsThreeDots className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
