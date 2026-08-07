"use client";

import type { ConversationTag } from "@/types/conversationTag";

interface QuickTagBarProps {
  tags: ConversationTag[];
  // id các thẻ ĐANG gắn cho hội thoại hiện tại — hội thoại có thể mang nhiều
  // thẻ cùng lúc (xem server/src/models/conversationTag.model.ts).
  activeTagIds: string[];
  onToggleTag?: (tagId: string) => void;
}

export function QuickTagBar({ tags, activeTagIds, onToggleTag }: QuickTagBarProps) {
  if (tags.length === 0) return null;

  return (
    <div className="flex flex-wrap border-t border-slate-200">
      {tags.map((tag) => {
        const isActive = activeTagIds.includes(tag.id);
        return (
          <button
            key={tag.id}
            type="button"
            onClick={() => onToggleTag?.(tag.id)}
            style={{ backgroundColor: tag.color }}
            className="relative flex min-w-[84px] flex-1 basis-24 items-center justify-center px-4 py-1.5 text-center text-xs font-semibold text-white transition-opacity cursor-pointer hover:opacity-90"
          >
            {isActive && <span className="absolute left-2.5 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-white" />}
            <span className="truncate">{tag.label}</span>
          </button>
        );
      })}
    </div>
  );
}
