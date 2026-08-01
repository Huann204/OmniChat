"use client";

import { Link2, History, Smile, Users, FolderOpen, Mail, MoreHorizontal } from "lucide-react";
import type { Conversation } from "@/types/conversation";

interface ChatHeaderProps {
  conversation: Conversation;
}

const HEADER_AVATAR_COLORS: Record<string, string> = {};

function avatarColorFor(name: string) {
  const colors = ["bg-blue-500", "bg-violet-500", "bg-amber-500", "bg-emerald-500", "bg-pink-500"];
  if (!HEADER_AVATAR_COLORS[name]) {
    HEADER_AVATAR_COLORS[name] = colors[name.length % colors.length];
  }
  return HEADER_AVATAR_COLORS[name];
}

export function ChatHeader({ conversation }: ChatHeaderProps) {
  const lastMessage = conversation.messages[conversation.messages.length - 1];

  return (
    <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2.5">
      <div className="flex items-center gap-3">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${avatarColorFor(
            conversation.customerName
          )}`}
        >
          {conversation.customerName.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-slate-900">{conversation.customerName}</h2>
          <p className="truncate text-xs text-slate-400">
            {conversation.lastSeenLabel}
            {lastMessage?.time ? ` • ${lastMessage.time}` : ""}
          </p>
          <div className="mt-0.5 flex items-center gap-2 text-slate-400">
            <Link2 className="h-3.5 w-3.5" />
            <History className="h-3.5 w-3.5" />
            <Smile className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 text-slate-400">
        {[Users, FolderOpen, Mail].map((Icon, i) => (
          <button
            key={i}
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
        <span className="mx-1 h-5 w-px bg-slate-200" />
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
