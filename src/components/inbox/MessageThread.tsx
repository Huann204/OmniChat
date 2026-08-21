"use client";

import * as React from "react";
import {
  BsCheckLg,
  BsFileEarmarkArrowDownFill,
  BsFillTelephoneFill,
  BsFillTelephoneXFill,
  BsFillEmojiSmileFill,
  BsReplyFill,
  BsThreeDots,
  BsPersonFill,
  BsX,
} from "react-icons/bs";
import { Loader2 } from "lucide-react";
import { ATTACHMENT_LABELS } from "@/lib/message-format";
import { cn } from "@/lib/utils";
import { toast } from "@/store/toast-store";
import type { ConversationMessage } from "@/types/conversation";
import { LottieSticker } from "./LottieSticker";

// Khớp CHANNEL_TYPE_ZALO_PERSONAL trong
// server/src/models/connectedPage.model.ts — chỉ Zalo hỗ trợ "Trả lời"/"Thả
// icon"/"Gửi nhãn dán" (Facebook không có API cho các việc này, xem
// server/src/services/channels/types.ts). Export để MessageComposer.tsx dùng
// chung (gate nút gửi nhãn dán), tránh định nghĩa trùng.
export const ZALO_CHANNEL_TYPE = 1;

// Bộ icon cho AGENT chọn khi thả — khớp ZALO_REACTIONS trong
// server/src/services/channels/zalo.channel.ts, gửi lên server bằng KEY (vd
// "HEART"), không phải emoji hay mã thô.
const REACTION_OPTIONS: { key: string; emoji: string }[] = [
  { key: "HEART", emoji: "❤️" },
  { key: "LIKE", emoji: "👍" },
  { key: "HAHA", emoji: "😆" },
  { key: "WOW", emoji: "😮" },
  { key: "CRY", emoji: "😢" },
  { key: "ANGRY", emoji: "😠" },
];

// Bảng tra hiển thị — KHÁC bộ trên: message.reactionIcon luôn lưu MÃ THÔ của
// Zalo (vd "/-heart"), không phải key ngữ nghĩa, vì field này còn được ghi
// bởi reaction khách TỰ thả từ app Zalo thật của họ (nghe qua listener, xem
// zaloSession.manager.ts) — khách có thể thả bất kỳ icon nào trong bộ ~50
// loại của Zalo, không chỉ 6 loại agent chọn được qua REACTION_OPTIONS, nên
// cần bảng đầy đủ hơn để hiện đúng thay vì rơi vào fallback chung chung.
const RAW_REACTION_EMOJI: Record<string, string> = {
  "/-heart": "❤️",
  "/-strong": "👍",
  ":>": "😆",
  ":o": "😮",
  ":-((": "😢",
  ":-h": "😠",
  ":-*": "😘",
  ":')": "😂",
  "/-shit": "💩",
  "/-rose": "🌹",
  "/-break": "💔",
  "/-weak": "👎",
  ";xx": "😍",
  ";-/": "😕",
  ";-)": "😉",
  "/-fade": "😵",
  "/-li": "☀️",
  "/-bd": "🎂",
  "/-bome": "💣",
  "/-ok": "👌",
  "/-v": "✌️",
  "/-thanks": "🙏",
  "/-punch": "👊",
  "/-share": "📤",
  "_()_": "🙏",
  "/-no": "🚫",
  "/-bad": "👎",
  "/-loveu": "🥰",
  "--b": "😞",
  ":((": "😭",
  "x-)": "😎",
  "8-)": "🤓",
  ";-d": "😃",
  "b-)": "😎",
  ":--|": "😐",
  "p-(": "🙁",
  ":-bye": "👋",
  "|-)": "😴",
  ":wipe": "😓",
  ":-dig": "⛏️",
  "&-(": "😧",
  ":handclap": "👏",
  ">-|": "😡",
  ":-f": "🪑",
  ":-l": "🪑",
  ":-r": "🪑",
  ";-x": "🤐",
  ":-o": "😲",
  ";-s": "😳",
  ";-a": "😨",
  ":-<": "😟",
  ":))": "😄",
  "$-)": "🤑",
  "/-beer": "🍺",
};

export interface ReplyTarget {
  id: string;
  text: string;
  senderLabel: string;
}

interface MessageThreadProps {
  messages: ConversationMessage[];
  customerName: string;
  customerAvatarUrl?: string;
  hasMoreMessages?: boolean;
  onLoadMore?: () => Promise<void>;
  // Kênh của hội thoại (Conversation.type) — quyết định có hiện nút Trả
  // lời/Thả icon hay không (chỉ Zalo).
  channelType?: number;
  onReply?: (target: ReplyTarget) => void;
  onReact?: (messageId: string, icon: string) => void;
}

// Cuộn lên gần sát đầu (trong khoảng này) mới coi là "muốn xem thêm tin cũ".
const LOAD_MORE_SCROLL_THRESHOLD = 80;

export function MessageThread({
  messages,
  customerName,
  customerAvatarUrl,
  hasMoreMessages = false,
  onLoadMore,
  channelType,
  onReply,
  onReact,
}: MessageThreadProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);
  // Ảnh đang xem to (lightbox) — bấm vào bất kỳ ảnh/sticker nào trong khung
  // chat sẽ mở overlay này, null = đang đóng.
  const [lightboxUrl, setLightboxUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!lightboxUrl) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setLightboxUrl(null);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxUrl]);
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

  // Bấm khung trích dẫn "Trả lời" trên 1 tin — cuộn tới đúng tin GỐC bị trả
  // lời + chớp sáng ngắn cho dễ nhận ra. Tin gốc phải đang có sẵn TRONG danh
  // sách `messages` hiện tải (data-message-id) — nếu là tin quá cũ chưa tải
  // (cuộn lên chưa tới), báo lỗi rõ ràng thay vì im lặng không làm gì.
  const [highlightedId, setHighlightedId] = React.useState<string | null>(null);
  const highlightTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    return () => {
      if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current);
    };
  }, []);

  function handleJumpToMessage(id: string) {
    const el = containerRef.current?.querySelector<HTMLElement>(`[data-message-id="${id}"]`);
    if (!el) {
      toast.error("Không tìm thấy tin gốc — có thể chưa tải tới, thử cuộn lên xem tin cũ hơn.");
      return;
    }
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current);
    setHighlightedId(id);
    highlightTimeoutRef.current = setTimeout(() => setHighlightedId(null), 1500);
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
        // So thêm senderName (không chỉ sender role) — nhóm Zalo nhiều
        // người cùng mang sender:"customer", so mỗi role thôi sẽ gộp lộn
        // các thành viên khác nhau vào 1 cụm, chỉ hiện avatar/tên của
        // NGƯỜI GỬI CUỐI trong cụm đó (che mất người gửi trước). 1-1/Facebook
        // không có senderName (luôn undefined ở cả 2 phía) nên so sánh này
        // không đổi hành vi cũ.
        const isLastInGroup =
          !next || next.sender !== message.sender || next.senderName !== message.senderName;
        return (
          <MessageRow
            key={message.id}
            message={message}
            customerName={customerName}
            customerAvatarUrl={customerAvatarUrl}
            showAvatar={isLastInGroup}
            onImageLoad={handleImageLoad}
            onImageClick={setLightboxUrl}
            canReplyReact={channelType === ZALO_CHANNEL_TYPE}
            onReply={onReply}
            onReact={onReact}
            onJumpToMessage={handleJumpToMessage}
            isHighlighted={message.id === highlightedId}
          />
        );
      })}

      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            type="button"
            aria-label="Đóng"
            onClick={() => setLightboxUrl(null)}
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 cursor-pointer"
          >
            <BsX className="h-5 w-5" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxUrl}
            alt="Xem ảnh cỡ lớn"
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

// Tự động nhận diện đường dẫn web (https://..., http://..., www....) trong nội dung tin nhắn và chuyển thành thẻ link bấm mở tab mới.
function FormattedMessageText({ text }: { text?: string }) {
  if (!text) return null;

  const URL_REGEX = /((?:https?:\/\/|www\.)[^\s<]+)/gi;
  const parts = text.split(URL_REGEX);

  return (
    <>
      {parts.map((part, index) => {
        if (part.match(/^https?:\/\/|^www\./i)) {
          let url = part;
          let trailing = "";
          const match = part.match(/([.,!?;)]+)$/);
          if (match) {
            trailing = match[1];
            url = part.slice(0, -trailing.length);
          }
          const href = url.startsWith("www.") ? `https://${url}` : url;

          return (
            <React.Fragment key={index}>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-blue-600 underline underline-offset-2 hover:text-blue-700 break-all cursor-pointer font-medium"
              >
                {url}
              </a>
              {trailing}
            </React.Fragment>
          );
        }
        return part;
      })}
    </>
  );
}

function MessageMeta({
  name,
  time,
  onReply,
  onReact,
}: {
  name: string;
  time: string;
  // Chỉ hiện nút tương ứng khi có handler — MessageRow đã tự tính điều kiện
  // (kênh, sender, loại tin) rồi mới quyết định truyền hay không, ở đây
  // không cần biết thêm gì về ngữ cảnh.
  onReply?: () => void;
  onReact?: (icon: string) => void;
}) {
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const pickerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!pickerOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [pickerOpen]);

  return (
    <div className="flex shrink-0 items-center opacity-0 transition-opacity group-hover:opacity-100">
      {onReact && (
        <div className="relative" ref={pickerRef}>
          <button
            type="button"
            onClick={() => setPickerOpen((v) => !v)}
            className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-black/5 hover:text-slate-600 cursor-pointer"
            aria-label="Thả cảm xúc"
          >
            <BsFillEmojiSmileFill className="h-4 w-4" />
          </button>
          {pickerOpen && (
            <div className="absolute bottom-full z-20 mb-1 flex items-center gap-0.5 rounded-full border border-slate-200 bg-white p-1 shadow-lg">
              {REACTION_OPTIONS.map((r) => (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => {
                    onReact(r.key);
                    setPickerOpen(false);
                  }}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-base transition-transform hover:scale-125 cursor-pointer"
                  aria-label={r.key}
                  title={r.key}
                >
                  {r.emoji}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      {onReply && (
        <button
          type="button"
          onClick={onReply}
          className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-black/5 hover:text-slate-600 cursor-pointer"
          aria-label="Trả lời"
        >
          <BsReplyFill className="h-4 w-4" />
        </button>
      )}
      <button
        type="button"
        className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-black/5 hover:text-slate-600 cursor-pointer"
        aria-label="Tùy chọn khác"
      >
        <BsThreeDots className="h-4 w-4" />
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
            <BsPersonFill className="h-5 w-5" />
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
  // Bấm vào ảnh/sticker trong tin nhắn — mở xem cỡ lớn (lightbox), xem
  // MessageThread.
  onImageClick?: (url: string) => void;
  // Chỉ true khi hội thoại là Zalo — Trả lời/Thả icon chỉ hiện + hoạt động
  // được trên tin của KHÁCH (không phải tin mình gửi, xem giải thích ở
  // server/src/models/message.model.ts#reactionIcon).
  canReplyReact?: boolean;
  onReply?: (target: ReplyTarget) => void;
  onReact?: (messageId: string, icon: string) => void;
  // Bấm vào khung trích dẫn "Trả lời" của TIN NÀY (nếu có replyToMessageId)
  // — cuộn tới đúng tin gốc, xem MessageThread#handleJumpToMessage.
  onJumpToMessage?: (id: string) => void;
  // true trong ~1.5s ngay sau khi tin NÀY vừa được cuộn tới (đích của 1 lượt
  // "nhảy tới tin gốc") — chớp sáng ngắn cho dễ nhận ra giữa nhiều tin khác.
  isHighlighted?: boolean;
}

function MessageRow({
  message,
  customerName,
  customerAvatarUrl,
  showAvatar,
  onImageLoad,
  onImageClick,
  canReplyReact,
  onReply,
  onReact,
  onJumpToMessage,
  isHighlighted,
}: MessageRowProps) {
  if (message.sender === "system") {
    return (
      <div className="flex justify-center py-2">
        <span className="rounded-full bg-black/5 px-3 py-1 text-xs text-slate-500">{message.text}</span>
      </div>
    );
  }

  const isPage = message.sender === "page";
  // Dùng chung message.senderName cho cả 2 trường hợp: khách trong nhóm
  // (tên riêng người đã gửi, khác customerName của cả nhóm) và tin Page (tên
  // nhân viên thật, server resolve từ Message.sentBy) — rơi về "Bạn"/
  // customerName nếu chưa có (tin cũ, hoặc Facebook echo không qua app này).
  const senderName = message.senderName ?? (isPage ? "Bạn" : customerName);
  const senderAvatarUrl = isPage ? undefined : message.senderAvatarUrl ?? customerAvatarUrl;

  // Trả lời trích dẫn: cả Facebook lẫn Zalo đều hỗ trợ thật (Facebook qua
  // field reply_to.mid, không có trong tài liệu chính thức nhưng đã kiểm
  // chứng hoạt động — xem facebook.service.ts) — áp dụng cho mọi loại tin
  // của khách (kể cả ảnh/sticker/video/file, không chỉ text; server đã lưu
  // đủ dữ liệu quote cho mọi loại, xem message.model.ts), trừ tin hệ thống
  // (call_*). Thả icon thì CHỈ Zalo hỗ trợ (Facebook không có API cho Page
  // tự thả icon, xem channels/types.ts).
  const canReact = canReplyReact && !isPage;
  const canReply = !isPage && !message.kind.startsWith("call_");
  const replyPreviewLabel =
    message.kind === "text"
      ? message.text ?? ""
      : ATTACHMENT_LABELS[message.kind] ?? "[Tệp đính kèm]";
  const replyHandler = canReply
    ? () => onReply?.({ id: message.id, text: replyPreviewLabel, senderLabel: senderName })
    : undefined;
  const reactHandler = canReact ? (icon: string) => onReact?.(message.id, icon) : undefined;

  if (message.kind === "call_request") {
    return (
      <div data-message-id={message.id} className="group flex items-end justify-end gap-2 py-1">
        <MessageMeta name={senderName} time={message.time} />
        <div className="max-w-sm rounded-2xl bg-[#d9fdd3] px-4 py-3 text-sm">
          <p className="font-semibold text-slate-800">{message.text}</p>
          {message.meta && <p className="mt-1 text-xs text-slate-500">{message.meta}</p>}
        </div>
      </div>
    );
  }

  if (
    message.kind === "image" ||
    message.kind === "sticker" ||
    message.kind === "lottie" ||
    message.kind === "video"
  ) {
    const urls = message.attachmentUrls ?? [];
    // Nhiều ảnh gộp chung 1 tin nhắn (message.attachments dạng mảng của
    // Facebook) — hiện thành lưới nhỏ trong cùng 1 bong bóng thay vì 1 ảnh
    // lớn. Sticker/video luôn chỉ có đúng 1 attachment nên không rơi vào
    // nhánh này.
    const isMultiImage = message.kind === "image" && urls.length > 1;

    return (
      <div
        data-message-id={message.id}
        className={cn(
          "group flex items-end gap-1.5 py-1 transition-colors",
          isPage ? "justify-end" : "justify-start",
          isHighlighted && "bg-primary/10"
        )}
      >
        {!isPage && (
          <Avatar
            show={showAvatar}
            avatarUrl={senderAvatarUrl}
            name={senderName}
            onImageLoad={onImageLoad}
          />
        )}
        {isPage && <MessageMeta name={senderName} time={message.time} />}

        <div className={cn("relative flex flex-col gap-1", isPage ? "items-end" : "items-start")}>
          {message.replyPreviewText && (
            <div
              onClick={
                message.replyToMessageId
                  ? () => onJumpToMessage?.(message.replyToMessageId!)
                  : undefined
              }
              className={cn(
                "mb-0.5 max-w-[260px] truncate rounded-t-lg rounded-b-xs border-l-2 px-2.5 py-1 text-xs font-medium transition-colors",
                message.replyToMessageId && "cursor-pointer hover:brightness-95",
                isPage
                  ? "border-emerald-600 bg-black/5 text-slate-700"
                  : "border-slate-400 bg-black/5 text-slate-600"
              )}
            >
              {message.replyPreviewText}
            </div>
          )}
          {message.reactionIcon && (
            <span
              className="absolute -bottom-2 right-1 z-10 flex h-5 w-5 items-center justify-center rounded-full border border-slate-200 bg-white text-xs shadow"
              title={message.reactionIcon}
            >
              {RAW_REACTION_EMOJI[message.reactionIcon] ?? "❤️"}
            </span>
          )}
          {isMultiImage ? (
            <div className="flex max-w-[260px] flex-wrap gap-1">
              {urls.map((url, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={url}
                  alt={`Hình ảnh ${i + 1}`}
                  className="h-[128px] w-[128px] cursor-pointer rounded-xl object-cover shadow-sm"
                  onLoad={onImageLoad}
                  onClick={() => onImageClick?.(url)}
                />
              ))}
            </div>
          ) : message.kind === "video" ? (
            // Video nhúng trực tiếp (thẻ <video> có controls sẵn của trình
            // duyệt) — trước đây rơi vào nhánh link "bấm mở tab mới" chung
            // với file/audio, xem nhánh return còn lại bên dưới.
            <video
              src={urls[0]}
              controls
              preload="metadata"
              className="max-h-[260px] max-w-[260px] rounded-2xl shadow-sm"
              onLoadedData={onImageLoad}
            />
          ) : message.kind === "lottie" ? (
            // Sticker Lottie (.tgs) — không phải ảnh/video render thẳng qua
            // url được, xem LottieSticker.tsx.
            <LottieSticker url={urls[0]} />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={urls[0]}
              alt={message.kind === "sticker" ? "Nhãn dán" : "Hình ảnh"}
              className={cn(
                "cursor-pointer shadow-sm",
                message.kind === "sticker"
                  ? "h-24 w-24 object-contain"
                  : "max-h-[260px] max-w-[260px] rounded-2xl object-cover"
              )}
              onLoad={onImageLoad}
              onClick={() => onImageClick?.(urls[0])}
            />
          )}

          {/* Chú thích đi kèm ảnh (gõ chữ + gửi ảnh cùng 1 tin) — Facebook
              hầu như không có, chỉ Zalo mới thấy nhưng xử lý chung được. */}
          {message.text && (
            <div
              className={cn(
                "max-w-sm min-w-0 whitespace-pre-wrap break-words [overflow-wrap:break-word] rounded-2xl px-4 py-2 text-sm shadow-sm",
                isPage ? "bg-[#d9fdd3] text-slate-800" : "bg-white text-slate-800"
              )}
            >
              <FormattedMessageText text={message.text} />
            </div>
          )}
        </div>

        {isPage && (
          <span className="mb-0.5 flex h-3 w-3 shrink-0 items-center justify-center">
            {message.status === "sending" ? (
              <Loader2 className="h-3 w-3 animate-spin text-slate-400" />
            ) : message.status === "failed" ? (
              <span
                className="flex h-3 w-3 items-center justify-center rounded-full bg-red-100 text-[8px] font-bold text-red-500"
                title="Gửi thất bại"
              >
                !
              </span>
            ) : (
              <BsCheckLg className="h-3 w-3 text-slate-400" />
            )}
          </span>
        )}

        {!isPage && (
          <MessageMeta
            name={senderName}
            time={message.time}
            onReply={replyHandler}
            onReact={reactHandler}
          />
        )}
      </div>
    );
  }

  if (message.kind === "call_outgoing" || message.kind === "call_missed") {
    const isMissed = message.kind === "call_missed";
    return (
      <div data-message-id={message.id} className="group flex items-end justify-end gap-2 py-1">
        <MessageMeta name={senderName} time={message.time} />
        <div className="flex max-w-sm items-center gap-3 rounded-2xl bg-[#d9fdd3] px-4 py-2.5 text-sm">
          <span
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
              isMissed ? "bg-rose-100 text-rose-500" : "bg-emerald-100 text-emerald-600"
            )}
          >
            {isMissed ? <BsFillTelephoneXFill className="h-4 w-4" /> : <BsFillTelephoneFill className="h-4 w-4" />}
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
      data-message-id={message.id}
      className={cn(
        "group flex items-end gap-1.5 py-1 transition-colors",
        isPage ? "justify-end" : "justify-start",
        isHighlighted && "bg-primary/10"
      )}
    >
      {!isPage && (
        <Avatar
          show={showAvatar}
          avatarUrl={senderAvatarUrl}
          name={senderName}
          onImageLoad={onImageLoad}
        />
      )}
      {isPage && <MessageMeta name={senderName} time={message.time} />}

      <div className="relative max-w-sm min-w-0">
        {message.replyPreviewText && (
          <div
            onClick={
              message.replyToMessageId
                ? () => onJumpToMessage?.(message.replyToMessageId!)
                : undefined
            }
            className={cn(
              "mb-0.5 truncate rounded-t-lg rounded-b-xs border-l-2 px-2.5 py-1 text-xs font-medium transition-colors",
              message.replyToMessageId && "cursor-pointer hover:brightness-95",
              isPage
                ? "border-emerald-600 bg-black/5 text-slate-700"
                : "border-slate-400 bg-black/5 text-slate-600"
            )}
          >
            {message.replyPreviewText}
          </div>
        )}
        {message.attachmentUrls?.[0] ? (
          // File/audio/video không hiện được trực tiếp như ảnh — hiện thành
          // 1 thẻ bấm mở/tải, khác hẳn bong bóng text thường (trước đây rơi
          // vào nhánh này thì chỉ hiện được đúng label "[Tệp đính kèm]",
          // không có link nào tới file thật dù URL đã có sẵn trong dữ liệu).
          <a
            href={message.attachmentUrls[0]}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "flex items-center gap-2.5 rounded-2xl px-4 py-2.5 text-sm shadow-sm transition-colors",
              isPage
                ? "bg-[#d9fdd3] text-slate-800 hover:bg-[#c5f5bd]"
                : "bg-white text-slate-800 hover:bg-slate-50"
            )}
          >
            <BsFileEarmarkArrowDownFill className="h-5 w-5 shrink-0 text-slate-500" />
            <span className="truncate underline underline-offset-2">{message.text}</span>
          </a>
        ) : (
          <div
            className={cn(
              "whitespace-pre-wrap break-words [overflow-wrap:break-word] rounded-2xl px-4 py-2 text-sm shadow-sm",
              isPage ? "bg-[#d9fdd3] text-slate-800" : "bg-white text-slate-800"
            )}
          >
            <FormattedMessageText text={message.text} />
          </div>
        )}
        {message.reactionIcon && (
          <span
            className="absolute -bottom-2 right-1 flex h-5 w-5 items-center justify-center rounded-full border border-slate-200 bg-white text-xs shadow"
            title={message.reactionIcon}
          >
            {RAW_REACTION_EMOJI[message.reactionIcon] ?? "❤️"}
          </span>
        )}
      </div>

      {isPage && (
        <span className="mb-0.5 flex h-3 w-3 shrink-0 items-center justify-center">
          {message.status === "sending" ? (
            <Loader2 className="h-3 w-3 animate-spin text-slate-400" />
          ) : message.status === "failed" ? (
            <span
              className="flex h-3 w-3 items-center justify-center rounded-full bg-red-100 text-[8px] font-bold text-red-500"
              title="Gửi thất bại"
            >
              !
            </span>
          ) : (
            <BsCheckLg className="h-3 w-3 text-slate-400" />
          )}
        </span>
      )}

      {!isPage && (
        <MessageMeta
          name={senderName}
          time={message.time}
          onReply={replyHandler}
          onReact={reactHandler}
        />
      )}
    </div>
  );
}
