"use client";

import * as React from "react";
import { Search, SlidersHorizontal, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Conversation } from "@/types/conversation";
import { getLastMessagePreview } from "@/lib/message-format";

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

interface ConversationListProps {
  conversations: Conversation[];
  activeId: string | null;
  search: string;
  onSearchChange: (value: string) => void;
  onSelect: (id: string) => void;
  // Chỉ truyền khi đang xem gộp nhiều Page — hiện avatar + tên Page nguồn
  // bên dưới mỗi hội thoại để phân biệt hội thoại đến từ Page nào.
  pagesById?: Record<string, PageInfo>;
}

export function ConversationList({
  conversations,
  activeId,
  search,
  onSearchChange,
  onSelect,
  pagesById,
}: ConversationListProps) {
  const filtered = conversations.filter((c) =>
    c.customerName.toLowerCase().includes(search.trim().toLowerCase())
  );

  return (
    <div className="flex w-[400px] shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="flex items-center gap-2 border-b border-slate-100 p-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm kiếm"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-white"
          />
        </div>
        <button
          type="button"
          className="flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 px-2.5 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 cursor-pointer"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Lọc theo
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 && (
          <p className="mt-10 text-center text-sm text-slate-400">Chưa có hội thoại nào</p>
        )}

        {filtered.map((conversation, index) => {
          const preview = getLastMessagePreview(conversation);
          const isActive = conversation.id === activeId;
          const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];
          const page = pagesById?.[conversation.pageId];

          return (
            <button
              key={conversation.id}
              type="button"
              onClick={() => onSelect(conversation.id)}
              className={cn(
                "flex w-full items-center gap-3 border-b border-slate-50 px-3 py-3 text-left transition-colors cursor-pointer hover:bg-slate-50",
                isActive && "bg-blue-50 hover:bg-blue-50"
              )}
            >
              {conversation.customerAvatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={conversation.customerAvatarUrl}
                  alt={conversation.customerName}
                  className="h-11 w-11 shrink-0 rounded-full object-cover"
                />
              ) : (
                <span
                  className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white",
                    avatarColor
                  )}
                >
                  {conversation.customerName.charAt(0).toUpperCase()}
                </span>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-1">
                    {conversation.isGroup && (
                      <Users
                        className="h-3.5 w-3.5 shrink-0 text-slate-400"
                        aria-label="Hội thoại nhóm"
                      />
                    )}
                    <span
                      className={cn(
                        "truncate text-sm text-slate-900",
                        !conversation.isRead && "font-bold"
                      )}
                    >
                      {conversation.customerName}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "shrink-0 text-xs text-slate-400",
                      !conversation.isRead && "font-semibold text-slate-600"
                    )}
                  >
                    {conversation.timeLabel}
                  </span>
                </div>
                <p
                  className={cn(
                    "truncate text-xs text-slate-400",
                    !conversation.isRead && "font-semibold text-slate-600"
                  )}
                >
                  {preview}
                </p>

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
                    <span className="truncate text-[11px] text-slate-400">{page.name}</span>
                  </div>
                )}
              </div>

              {!conversation.isRead && (
                <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
