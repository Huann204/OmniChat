"use client";

import * as React from "react";
import { BsSearch, BsSliders, BsFillPeopleFill } from "react-icons/bs";
import { cn } from "@/lib/utils";
import { CHANNEL_META } from "@/lib/bot-channel";
import type { Conversation } from "@/types/conversation";
import { getLastMessagePreview } from "@/lib/message-format";

// Khớp CHANNEL_TYPE_* trong server/src/models/connectedPage.model.ts — không
// có package dùng chung giữa 2 repo nên phải giữ đồng bộ thủ công (xem
// channelFromType trong lib/dal.ts, cùng quy ước).
const CHANNEL_META_BY_TYPE = {
  0: CHANNEL_META.facebook,
  1: CHANNEL_META.zalo,
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

interface ConversationListProps {
  conversations: Conversation[];
  activeId: string | null;
  search: string;
  onSearchChange: (value: string) => void;
  onSelect: (id: string) => void;
  // Chỉ truyền khi đang xem gộp nhiều Page — hiện avatar + tên Page nguồn
  // bên dưới mỗi hội thoại để phân biệt hội thoại đến từ Page nào.
  pagesById?: Record<string, PageInfo>;
  className?: string;
}

export function ConversationList({
  conversations,
  activeId,
  search,
  onSearchChange,
  onSelect,
  pagesById,
  className,
}: ConversationListProps) {
  const filtered = conversations.filter((c) =>
    c.customerName.toLowerCase().includes(search.trim().toLowerCase())
  );

  return (
    <div
      className={cn(
        "flex flex-col border-r border-slate-200 bg-white md:w-[25%] xl:w-[400px] shrink-0 h-full",
        activeId ? "hidden md:flex" : "flex w-full md:w-[25%] xl:w-[400px]",
        className
      )}
    >
      <div className="flex items-center gap-2 border-b border-slate-100 p-3">
        <div className="relative flex-1">
          <BsSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm kiếm"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-white"
          />
        </div>
        <button
          type="button"
          className="flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 px-2.5 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 cursor-pointer"
        >
          <BsSliders className="h-3.5 w-3.5" />
          Lọc theo
        </button>
      </div>

      <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {filtered.length === 0 && (
          <p className="mt-10 text-center text-sm text-slate-400">Chưa có hội thoại nào</p>
        )}

        {filtered.map((conversation, index) => {
          const preview = getLastMessagePreview(conversation);
          const isActive = conversation.id === activeId;
          const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];
          const page = pagesById?.[conversation.pageId];
          const channelMeta =
            CHANNEL_META_BY_TYPE[conversation.type as keyof typeof CHANNEL_META_BY_TYPE];

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
              <div className="relative shrink-0">
                {conversation.customerAvatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={conversation.customerAvatarUrl}
                    alt={conversation.customerName}
                    className="h-11 w-11 rounded-full object-cover"
                  />
                ) : (
                  <span
                    className={cn(
                      "flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold text-white",
                      avatarColor
                    )}
                  >
                    {conversation.customerName.charAt(0).toUpperCase()}
                  </span>
                )}

                {/* Chấm đỏ báo chưa đọc — góc dưới bên phải avatar. */}
                {!conversation.isRead && (
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-red-500 ring-2 ring-white" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-1">
                    {conversation.isGroup && (
                      <BsFillPeopleFill
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

                <div className="mt-1 flex min-h-[20px] items-center gap-1.5">
                  {page && (
                    <div className="flex min-w-0 shrink-0 items-center gap-1.5">
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
                      <span className="truncate text-[11px] text-slate-400 max-w-[80px]">{page.name}</span>
                    </div>
                  )}

                  {page && conversation.tags.length > 0 && (
                    <div className="h-3 w-px shrink-0 bg-slate-200" />
                  )}

                  {conversation.tags.length > 0 && (
                    <div className="flex min-w-0 flex-1 items-center gap-1">
                      {conversation.tags.slice(0, 1).map((tag) => (
                        <span
                          key={tag.id}
                          style={{ backgroundColor: tag.color }}
                          className="truncate rounded-full px-2 py-0.5 text-[10px] font-semibold text-white max-w-[80px]"
                        >
                          {tag.label}
                        </span>
                      ))}
                      {conversation.tags.length > 1 && (
                        <div className="group/more relative flex shrink-0 items-center">
                          <span className="rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                            +{conversation.tags.length - 1}
                          </span>
                          <div className="pointer-events-none absolute bottom-full left-1/2 z-[999] mb-2 hidden w-max max-w-[200px] -translate-x-1/2 flex-wrap gap-1 rounded-lg border border-slate-200 bg-white p-1.5 shadow-xl group-hover/more:flex">
                            {/* Mũi tên chỉ xuống */}
                            <div className="absolute -bottom-1 left-1/2 -ml-1 h-2 w-2 rotate-45 border-b border-r border-slate-200 bg-white"></div>
                            {conversation.tags.map((tag) => (
                              <span
                                key={tag.id}
                                style={{ backgroundColor: tag.color }}
                                className="relative z-10 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
                              >
                                {tag.label}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {page && channelMeta && (
                    <channelMeta.icon className="ml-auto h-3.5 w-3.5 shrink-0 rounded-full object-cover" />
                  )}
                </div>
              </div>

            </button>
          );
        })}
      </div>
    </div>
  );
}
