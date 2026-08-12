"use client";

import * as React from "react";
import Image from "next/image";
import {
  BsFillTelephoneFill,
  BsStickyFill,
  BsPaperclip,
  BsFillImageFill,
  BsChatSquareTextFill,
  BsSendFill,
  BsQuestionCircleFill,
  BsX,
} from "react-icons/bs";
import { cn } from "@/lib/utils";
import { MediaPickerModal } from "@/components/media/MediaPickerModal";
import type { MediaItem } from "@/types/media";
import type { QuickReply } from "@/types/quickReply";
import type { ReplyTarget } from "./MessageThread";

interface MessageComposerProps {
  onSend: (text: string, imageUrls: string[], replyToMessageId?: string) => void | Promise<void>;
  // Mẫu trả lời nhanh của Shop — gõ "/" + ký tự tắt để gợi ý, hoặc bấm nút
  // ghi chú (StickyNote) để xem toàn bộ danh sách, xem
  // slashQuery/quickReplyDropdownItems bên dưới.
  quickReplies?: QuickReply[];
  // Đang trả lời trích dẫn 1 tin nào đó (bấm nút Trả lời trong MessageThread)
  // — controlled từ InboxView, không phải state nội bộ, vì cả 2 nơi
  // (MessageThread bấm chọn, InboxView xoá sau khi gửi) đều cần đọc/ghi.
  replyingTo?: ReplyTarget | null;
  onCancelReply?: () => void;
}

// Ảnh của mẫu trả lời nhanh chỉ có URL (Server không lưu đủ metadata như
// Media thật, xem server/src/models/quickReply.model.ts) — tự bù các field
// còn lại của MediaItem bằng giá trị vô hại, không ảnh hưởng gì vì
// bytes/createdAt/originalFilename không được dùng để hiển thị ở composer
// (chỉ url/id được dùng, xem JSX bên dưới).
function quickReplyImageToMediaItem(url: string): MediaItem {
  return {
    id: crypto.randomUUID(),
    url,
    resourceType: "image",
    bytes: 0,
    originalFilename: "Ảnh mẫu",
    createdAt: new Date().toISOString(),
  };
}

// Chiều cao tối đa trước khi textarea tự cuộn thay vì phình thêm — khoảng
// 6 dòng, tránh khung soạn tin nuốt hết chỗ của khung chat nếu gõ quá dài.
const COMPOSER_MAX_HEIGHT = 140;

// Cho phép component cha (InboxView) tự điền text vào ô soạn tin từ bên
// ngoài — dùng khi bấm 1 gợi ý trong AiSuggestionBar. value là state nội bộ
// (không controlled từ prop) nên cần expose qua ref thay vì 1 prop `value`.
export interface MessageComposerHandle {
  setText: (text: string) => void;
}

export const MessageComposer = React.forwardRef<MessageComposerHandle, MessageComposerProps>(
  function MessageComposer({ onSend, quickReplies = [], replyingTo, onCancelReply }, ref) {
  const [value, setValue] = React.useState("");
  const [isSending, setIsSending] = React.useState(false);
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [attachedImages, setAttachedImages] = React.useState<MediaItem[]>([]);
  // Bấm nút StickyNote để tự mở XEM HẾT danh sách mẫu (không cần gõ "/") —
  // khác slashQuery (tự mở khi đang gõ, lọc theo ký tự tắt).
  const [manualListOpen, setManualListOpen] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useImperativeHandle(ref, () => ({
    setText: (text: string) => setValue(text),
  }));

  // Tự phình cao theo nội dung — input/textarea mặc định không tự cao lên,
  // phải tự đo lại scrollHeight mỗi khi value đổi (kể cả lúc reset về ""
  // sau khi gửi, để co lại đúng về 1 dòng).
  React.useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, COMPOSER_MAX_HEIGHT)}px`;
  }, [value]);

  // Đang gõ "/..." (chưa có khoảng trắng) -> đang tìm mẫu theo ký tự tắt,
  // ưu tiên hơn danh sách mở thủ công (đang gõ thì phải lọc theo đúng cái
  // đang gõ, không phải hiện lại toàn bộ).
  const slashQuery = value.startsWith("/") && !value.includes(" ") ? value.slice(1) : null;
  const quickReplyDropdownItems =
    slashQuery !== null
      ? quickReplies
          .filter((q) => q.shortcut.toLowerCase().startsWith(slashQuery.toLowerCase()))
          .slice(0, 6)
      : manualListOpen
        ? quickReplies
        : [];

  function applyQuickReply(item: QuickReply) {
    setValue(item.message ?? "");
    setAttachedImages(item.images.map(quickReplyImageToMediaItem));
    setManualListOpen(false);
  }

  async function handleSend() {
    const trimmedText = value.trim();
    if ((!trimmedText && attachedImages.length === 0) || isSending) return;

    const imageUrls = attachedImages.map((item) => item.url);
    const replyToMessageId = replyingTo?.id;
    setValue("");
    setAttachedImages([]);
    onCancelReply?.();
    setIsSending(true);
    try {
      await onSend(trimmedText, imageUrls, replyToMessageId);
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
      {replyingTo && (
        <div className="mb-2 flex items-center gap-2 rounded-lg border-l-2 border-primary bg-slate-50 py-1.5 pl-2.5 pr-1.5">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-primary">Trả lời {replyingTo.senderLabel}</p>
            <p className="truncate text-xs text-slate-500">{replyingTo.text}</p>
          </div>
          <button
            type="button"
            onClick={onCancelReply}
            aria-label="Huỷ trả lời"
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600 cursor-pointer"
          >
            <BsX className="h-4 w-4" />
          </button>
        </div>
      )}
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
                <BsX className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="relative">
        {manualListOpen && (
          <div className="fixed inset-0 z-10" onClick={() => setManualListOpen(false)} />
        )}

        {quickReplyDropdownItems.length > 0 && (
          <div className="absolute bottom-full left-0 z-20 mb-1.5 max-h-72 w-full max-w-sm overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
            {quickReplyDropdownItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => applyQuickReply(item)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-slate-50 cursor-pointer"
              >
                {item.images[0] && (
                  <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-md border border-slate-200">
                    <Image src={item.images[0]} alt="" fill className="object-cover" unoptimized />
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-semibold text-primary">
                    /{item.shortcut}
                  </span>
                  {item.message && (
                    <span className="block truncate text-xs text-slate-500">{item.message}</span>
                  )}
                </span>
              </button>
            ))}
          </div>
        )}

        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (quickReplyDropdownItems.length > 0 && (e.key === "Enter" || e.key === "Tab")) {
              e.preventDefault();
              applyQuickReply(quickReplyDropdownItems[0]);
              return;
            }
            // Enter thường -> gửi. Shift+Enter -> để mặc định trình duyệt tự
            // xuống dòng trong textarea (không preventDefault).
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Nhập tin nhắn... (gõ / để chèn mẫu trả lời nhanh, Shift+Enter để xuống dòng)"
          className="block w-full resize-none overflow-y-auto border-none bg-transparent py-1.5 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
        />
      </div>

      <div className="mt-1 flex items-center justify-between">
        <div className="flex items-center gap-1 text-slate-400">
          <BsQuestionCircleFill className="h-4.5 w-4.5" />
        </div>

        <div className="flex items-center gap-1 text-slate-400">
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
          >
            <BsFillTelephoneFill className="h-4.5 w-4.5" />
          </button>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
          >
            <BsStickyFill className="h-4.5 w-4.5" />
          </button>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
          >
            <BsPaperclip className="h-4.5 w-4.5" />
          </button>
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            aria-label="Chọn ảnh từ thư viện"
            className="relative flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
          >
            <BsFillImageFill className="h-4.5 w-4.5" />
            {attachedImages.length > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold leading-none text-white">
                {attachedImages.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setManualListOpen((v) => !v)}
            aria-label="Xem danh sách mẫu trả lời nhanh"
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full transition-colors cursor-pointer",
              manualListOpen ? "bg-primary/10 text-primary" : "hover:bg-slate-100 hover:text-slate-700"
            )}
          >
            <BsChatSquareTextFill className="h-4.5 w-4.5" />
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={isSending}
            aria-label="Gửi tin nhắn"
            className="flex h-8 w-8 items-center justify-center rounded-full text-primary transition-colors hover:bg-primary/10 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          >
            <BsSendFill className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>

      <MediaPickerModal open={pickerOpen} onClose={() => setPickerOpen(false)} onSelect={handlePickImages} />
    </div>
  );
  }
);
