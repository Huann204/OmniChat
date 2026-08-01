"use client";

import * as React from "react";
import { Phone, StickyNote, Paperclip, Image as ImageIcon, MessageSquareText, Send, HelpCircle } from "lucide-react";

interface MessageComposerProps {
  onSend: (text: string) => void;
}

export function MessageComposer({ onSend }: MessageComposerProps) {
  const [value, setValue] = React.useState("");

  function handleSend() {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setValue("");
  }

  return (
    <div className="border-t border-slate-200 bg-white px-4 py-2">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
          }
        }}
        placeholder="Nhập tin nhắn..."
        className="w-full border-none bg-transparent py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
      />

      <div className="mt-1 flex items-center justify-between">
        <div className="flex items-center gap-1 text-slate-400">
          <HelpCircle className="h-4.5 w-4.5" />
        </div>

        <div className="flex items-center gap-1 text-slate-400">
          {[Phone, StickyNote, Paperclip, ImageIcon, MessageSquareText].map((Icon, i) => (
            <button
              key={i}
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
            >
              <Icon className="h-4.5 w-4.5" />
            </button>
          ))}
          <button
            type="button"
            onClick={handleSend}
            aria-label="Gửi tin nhắn"
            className="flex h-8 w-8 items-center justify-center rounded-full text-primary transition-colors hover:bg-primary/10 cursor-pointer"
          >
            <Send className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
