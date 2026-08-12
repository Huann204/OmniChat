"use client";

import * as React from "react";
import { BsStars, BsChevronDown, BsArrowRepeat } from "react-icons/bs";
import { Loader2 } from "lucide-react";

interface AiSuggestionBarProps {
  suggestions: string[];
  loading: boolean;
  onSelect: (text: string) => void;
  // true khi suggestReplyTrigger = "manual" — không tự fetch, chỉ hiện nút
  // để người dùng tự bấm xin gợi ý (xem onRequest).
  manual?: boolean;
  onRequest?: () => void;
}

const MAX_VISIBLE_SUGGESTIONS = 3;

// Chèn text vào ô soạn tin khi bấm (xem MessageComposer#setText) — KHÔNG tự
// gửi thẳng, để nhân viên còn duyệt/sửa trước, giống 1 gợi ý chứ không phải
// auto-reply.
export function AiSuggestionBar({
  suggestions,
  loading,
  onSelect,
  manual = false,
  onRequest,
}: AiSuggestionBarProps) {
  const [showMoreOpen, setShowMoreOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Đóng dropdown khi click ngoài
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowMoreOpen(false);
      }
    }
    if (showMoreOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMoreOpen]);

  if (!loading && suggestions.length === 0 && !manual) return null;

  const visibleSuggestions = suggestions.slice(0, MAX_VISIBLE_SUGGESTIONS);
  const extraSuggestions = suggestions.slice(MAX_VISIBLE_SUGGESTIONS);

  return (
    <div className="relative flex items-center gap-2 overflow-hidden border-t border-slate-200 bg-violet-50/40 px-3 py-2 select-none">
      <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-violet-500">
        <BsStars className="h-3.5 w-3.5" />
        AI gợi ý
      </span>

      {loading ? (
        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-violet-400" />
      ) : suggestions.length > 0 ? (
        <div className="flex flex-1 items-center gap-2 overflow-hidden min-w-0">
          {visibleSuggestions.map((text, index) => (
            <button
              key={index}
              type="button"
              onClick={() => onSelect(text)}
              title={text}
              className="flex-1 min-w-0 truncate rounded-full border border-violet-200 bg-white px-3 py-1.5 text-xs font-medium text-violet-700 transition-colors hover:bg-violet-100 cursor-pointer text-center"
            >
              {text}
            </button>
          ))}

          {extraSuggestions.length > 0 && (
            <div className="relative shrink-0" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setShowMoreOpen((prev) => !prev)}
                className="flex items-center gap-1 rounded-full border border-violet-200 bg-white px-2.5 py-1 text-xs font-medium text-violet-600 hover:bg-violet-100 cursor-pointer transition-colors"
              >
                +{extraSuggestions.length} khác
                <BsChevronDown className="h-3 w-3" />
              </button>

              {showMoreOpen && (
                <div className="absolute bottom-full left-0 mb-1 z-20 w-64 max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-white p-1.5 shadow-lg">
                  {extraSuggestions.map((text, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        onSelect(text);
                        setShowMoreOpen(false);
                      }}
                      className="w-full text-left rounded-md px-2.5 py-1.5 text-xs text-slate-700 hover:bg-violet-50 hover:text-violet-700 transition-colors cursor-pointer line-clamp-2"
                      title={text}
                    >
                      {text}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {manual && (
            <button
              type="button"
              onClick={onRequest}
              aria-label="Sinh lại gợi ý"
              title="Sinh lại gợi ý"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-violet-400 transition-colors hover:bg-violet-100 hover:text-violet-600 cursor-pointer ml-auto"
            >
              <BsArrowRepeat className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      ) : (
        manual && (
          <button
            type="button"
            onClick={onRequest}
            className="shrink-0 rounded-full border border-violet-200 bg-white px-3 py-1.5 text-xs font-medium text-violet-700 transition-colors hover:bg-violet-100 cursor-pointer"
          >
            Xem gợi ý trả lời
          </button>
        )
      )}
    </div>
  );
}
