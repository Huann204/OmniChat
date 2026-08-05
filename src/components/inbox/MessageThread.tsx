"use client";

import * as React from "react";
import { Check, Loader2, Phone, PhoneMissed, Smile, Reply, MoreHorizontal, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConversationMessage } from "@/types/conversation";

interface MessageThreadProps {
  messages: ConversationMessage[];
  customerName: string;
  customerAvatarUrl?: string;
  hasMoreMessages?: boolean;
  onLoadMore?: () => Promise<void>;
}

// Cuộn lên gần sát đầu (trong khoảng này) mới coi là "muốn xem thêm tin cũ".
const LOAD_MORE_SCROLL_THRESHOLD = 80;

export function MessageThread({
  messages,
  customerName,
  customerAvatarUrl,
  hasMoreMessages = false,
  onLoadMore,
}: MessageThreadProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);
  // true khi đang neo ở đáy khung chat — chỉ tự cuộn xuống lúc ảnh load
  // xong trong trường hợp này, tránh giật màn hình khi đang xem tin nhắn cũ.
  const isNearBottomRef = React.useRef(true);
  // Đánh dấu lần `messages` đổi sắp tới là do vừa tải thêm tin cũ (chèn vào
  // đầu mảng) — lúc đó phải giữ nguyên vị trí đang xem, không cuộn xuống đáy.
  const justLoadedMoreRef = React.useRef(false);
  const prevScrollHeightRef = React.useRef<number | null>(null);

  const scrollToBottom = React.useCallback(() => {
    const el = containerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  React.useEffect(() => {
    const el = containerRef.current;
    if (justLoadedMoreRef.current && el && prevScrollHeightRef.current != null) {
      // Bù đúng phần chiều cao vừa chèn thêm vào đầu — giữ tin nhắn đang
      // xem ở đúng vị trí thay vì bị đẩy tuột xuống.
      el.scrollTop = el.scrollHeight - prevScrollHeightRef.current;
      justLoadedMoreRef.current = false;
      prevScrollHeightRef.current = null;
      return;
    }

    scrollToBottom();
    // Chạy lại sau khi layout đã "chốt" (ví dụ vừa đổi hội thoại), phòng
    // trường hợp trình duyệt chưa kịp tính xong chiều cao ở lần render đầu.
    const raf = requestAnimationFrame(scrollToBottom);
    return () => cancelAnimationFrame(raf);
  }, [messages, scrollToBottom]);

  function handleScroll() {
    const el = containerRef.current;
    if (!el) return;

    isNearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;

    if (!hasMoreMessages || !onLoadMore || isLoadingMore) return;
    if (el.scrollTop > LOAD_MORE_SCROLL_THRESHOLD) return;

    setIsLoadingMore(true);
    justLoadedMoreRef.current = true;
    prevScrollHeightRef.current = el.scrollHeight;
    onLoadMore().finally(() => setIsLoadingMore(false));
  }

  function handleImageLoad() {
    if (isNearBottomRef.current) scrollToBottom();
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 space-y-1 overflow-x-hidden overflow-y-auto bg-[#f3f0eb] pr-[2px] pl-2  py-4 [&::-webkit-scrollbar-thumb]:bg-transparent! hover:[&::-webkit-scrollbar-thumb]:bg-slate-300!"
    >
      {isLoadingMore && (
        <div className="flex justify-center py-2">
          <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
        </div>
      )}
      {messages.map((message, index) => {
        const next = messages[index + 1];
        const isLastInGroup = !next || next.sender !== message.sender;
        return (
          <MessageRow
            key={message.id}
            message={message}
            customerName={customerName}
            customerAvatarUrl={customerAvatarUrl}
            showAvatar={isLastInGroup}
            onImageLoad={handleImageLoad}
          />
        );
      })}
    </div>
  );
}

function MessageMeta({ name, time }: { name: string; time: string }) {
  return (
    <div className="flex shrink-0 items-center opacity-0 transition-opacity group-hover:opacity-100">
      <button
        type="button"
        className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-black/5 hover:text-slate-600 cursor-pointer"
        aria-label="Thả cảm xúc"
      >
        <Smile className="h-4 w-4" />
      </button>
      <button
        type="button"
        className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-black/5 hover:text-slate-600 cursor-pointer"
        aria-label="Trả lời"
      >
        <Reply className="h-4 w-4" />
      </button>
      <button
        type="button"
        className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-black/5 hover:text-slate-600 cursor-pointer"
        aria-label="Tùy chọn khác"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      <div className="ml-1 leading-tight">
        <p className="whitespace-nowrap text-xs font-medium text-slate-500">{name}</p>
        <p className="whitespace-nowrap text-xs text-slate-400">{time}</p>
      </div>
    </div>
  );
}

function Avatar({
  show,
  avatarUrl,
  name,
  onImageLoad,
}: {
  show: boolean;
  avatarUrl?: string;
  name: string;
  onImageLoad?: () => void;
}) {
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center self-end">
      {show &&
        (avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt={name}
            className="h-9 w-9 rounded-full object-cover"
            onLoad={onImageLoad}
          />
        ) : (
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-slate-400">
            <User className="h-5 w-5" />
          </span>
        ))}
    </div>
  );
}

interface MessageRowProps {
  message: ConversationMessage;
  customerName: string;
  customerAvatarUrl?: string;
  showAvatar: boolean;
  onImageLoad?: () => void;
}

function MessageRow({ message, customerName, customerAvatarUrl, showAvatar, onImageLoad }: MessageRowProps) {
  if (message.sender === "system") {
    return (
      <div className="flex justify-center py-2">
        <span className="rounded-full bg-black/5 px-3 py-1 text-xs text-slate-500">{message.text}</span>
      </div>
    );
  }

  const isPage = message.sender === "page";
  const senderName = isPage ? "Bạn" : customerName;

  if (message.kind === "call_request") {
    return (
      <div className="group flex items-end justify-end gap-2 py-1">
        <MessageMeta name={senderName} time={message.time} />
        <div className="max-w-sm rounded-2xl bg-[#d9fdd3] px-4 py-3 text-sm">
          <p className="font-semibold text-slate-800">{message.text}</p>
          {message.meta && <p className="mt-1 text-xs text-slate-500">{message.meta}</p>}
        </div>
      </div>
    );
  }

  if (message.kind === "image" || message.kind === "sticker") {
    const urls = message.attachmentUrls ?? [];
    // Nhiều ảnh gộp chung 1 tin nhắn (message.attachments dạng mảng của
    // Facebook) — hiện thành lưới nhỏ trong cùng 1 bong bóng thay vì 1 ảnh
    // lớn. Sticker luôn chỉ có đúng 1 ảnh nên không rơi vào nhánh này.
    const isMultiImage = message.kind === "image" && urls.length > 1;

    return (
      <div
        className={cn(
          "group flex items-center gap-1.5 py-1",
          isPage ? "justify-end" : "justify-start"
        )}
      >
        {!isPage && (
          <Avatar
            show={showAvatar}
            avatarUrl={customerAvatarUrl}
            name={customerName}
            onImageLoad={onImageLoad}
          />
        )}
        {isPage && <MessageMeta name={senderName} time={message.time} />}

        {isMultiImage ? (
          <div className="flex max-w-[260px] flex-wrap gap-1">
            {urls.map((url, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={url}
                alt={`Hình ảnh ${i + 1}`}
                className="h-[128px] w-[128px] rounded-xl object-cover shadow-sm"
                onLoad={onImageLoad}
              />
            ))}
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={urls[0]}
            alt={message.kind === "sticker" ? "Nhãn dán" : "Hình ảnh"}
            className={cn(
              "shadow-sm",
              message.kind === "sticker"
                ? "h-24 w-24 object-contain"
                : "max-h-[260px] max-w-[260px] rounded-2xl object-cover"
            )}
            onLoad={onImageLoad}
          />
        )}

        {!isPage && <MessageMeta name={senderName} time={message.time} />}
      </div>
    );
  }

  if (message.kind === "call_outgoing" || message.kind === "call_missed") {
    const isMissed = message.kind === "call_missed";
    return (
      <div className="group flex items-end justify-end gap-2 py-1">
        <MessageMeta name={senderName} time={message.time} />
        <div className="flex max-w-sm items-center gap-3 rounded-2xl bg-[#d9fdd3] px-4 py-2.5 text-sm">
          <span
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
              isMissed ? "bg-rose-100 text-rose-500" : "bg-emerald-100 text-emerald-600"
            )}
          >
            {isMissed ? <PhoneMissed className="h-4 w-4" /> : <Phone className="h-4 w-4" />}
          </span>
          <div>
            <p className="font-semibold text-slate-800">{message.text}</p>
            {message.meta && (
              <p className={cn("text-xs", isMissed ? "text-rose-500" : "text-slate-500")}>{message.meta}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group flex items-end gap-1.5 py-1",
        isPage ? "justify-end" : "justify-start"
      )}
    >
      {!isPage && (
        <Avatar
          show={showAvatar}
          avatarUrl={customerAvatarUrl}
          name={customerName}
          onImageLoad={onImageLoad}
        />
      )}
      {isPage && <MessageMeta name={senderName} time={message.time} />}

      <div
        className={cn(
          "max-w-sm rounded-2xl px-4 py-2 text-sm shadow-sm",
          isPage ? "bg-[#d9fdd3] text-slate-800" : "bg-white text-slate-800"
        )}
      >
        {message.text}
      </div>

      {isPage && (
        <span className="mb-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center">
          {message.status === "sending" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
          ) : message.status === "failed" ? (
            <span
              className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-100 text-[9px] font-bold text-red-500"
              title="Gửi thất bại"
            >
              !
            </span>
          ) : (
            <Check className="h-3.5 w-3.5 text-slate-400" />
          )}
        </span>
      )}

      {!isPage && <MessageMeta name={senderName} time={message.time} />}
    </div>
  );
}
