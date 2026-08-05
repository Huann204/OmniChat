"use client";

import * as React from "react";
import Image from "next/image";
import { Phone, StickyNote, Paperclip, Image as ImageIcon, MessageSquareText, Send, HelpCircle, X } from "lucide-react";
import { MediaPickerModal } from "@/components/media/MediaPickerModal";
import type { MediaItem } from "@/types/media";

interface MessageComposerProps {
  onSend: (text: string, imageUrls: string[]) => void | Promise<void>;
}

const PLACEHOLDER_ICONS = [Phone, StickyNote, Paperclip, MessageSquareText];

export function MessageComposer({ onSend }: MessageComposerProps) {
  const [value, setValue] = React.useState("");
  const [isSending, setIsSending] = React.useState(false);
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [attachedImages, setAttachedImages] = React.useState<MediaItem[]>([]);

  async function handleSend() {
    const trimmedText = value.trim();
    if ((!trimmedText && attachedImages.length === 0) || isSending) return;

    const imageUrls = attachedImages.map((item) => item.url);
    setValue("");
    setAttachedImages([]);
    setIsSending(true);
    try {
      await onSend(trimmedText, imageUrls);
    } finally {
      setIsSending(false);
    }
  }

  function handlePickImages(items: MediaItem[]) {
    setAttachedImages((prev) => [...prev, ...items]);
  }

  function removeAttachment(id: string) {
    setAttachedImages((prev) => prev.filter((item) => item.id !== id));
  }

  return (
    <div className="border-t border-slate-200 bg-white px-4 py-2">
      {attachedImages.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2 rounded-lg bg-slate-100 p-2">
          {attachedImages.map((item) => (
            <div
              key={item.id}
              className="group relative h-14 w-14 shrink-0 overflow-hidden rounded-md border border-slate-200 bg-white"
            >
              <Image
                src={item.url}
                alt={item.originalFilename}
                fill
                className="object-cover"
                unoptimized
              />
              <button
                type="button"
                onClick={() => removeAttachment(item.id)}
                aria-label={`Bỏ ${item.originalFilename}`}
                className="absolute right-0.5 top-0.5 flex h-4 w-4 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </div>
          ))}
        </div>
      )}

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
          {PLACEHOLDER_ICONS.slice(0, 3).map((Icon, i) => (
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
            onClick={() => setPickerOpen(true)}
            aria-label="Chọn ảnh từ thư viện"
            className="relative flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
          >
            <ImageIcon className="h-4.5 w-4.5" />
            {attachedImages.length > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold leading-none text-white">
                {attachedImages.length}
              </span>
            )}
          </button>
          {PLACEHOLDER_ICONS.slice(3).map((Icon, i) => (
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
            disabled={isSending}
            aria-label="Gửi tin nhắn"
            className="flex h-8 w-8 items-center justify-center rounded-full text-primary transition-colors hover:bg-primary/10 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>

      <MediaPickerModal open={pickerOpen} onClose={() => setPickerOpen(false)} onSelect={handlePickImages} />
    </div>
  );
}
