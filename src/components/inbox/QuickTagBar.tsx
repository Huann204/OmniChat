"use client";

import { QUICK_TAGS } from "@/lib/quick-tags";
import { cn } from "@/lib/utils";

interface QuickTagBarProps {
  onTagClick?: (tagId: string) => void;
}

export function QuickTagBar({ onTagClick }: QuickTagBarProps) {
  return (
    <div className="grid grid-cols-6 border-t border-slate-200">
      {QUICK_TAGS.map((tag) => (
        <button
          key={tag.id}
          type="button"
          onClick={() => onTagClick?.(tag.id)}
          className={cn(
            "py-1.5 text-center text-xs font-semibold text-white transition-colors cursor-pointer",
            tag.className
          )}
        >
          {tag.label}
        </button>
      ))}
    </div>
  );
}
