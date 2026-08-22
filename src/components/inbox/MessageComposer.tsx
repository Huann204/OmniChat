"use client";

import * as React from "react";
import Image from "next/image";
import {
  BsStickyFill,
  BsPaperclip,
  BsFileEarmarkFill,
  BsFillImageFill,
  BsChatSquareTextFill,
  BsSendFill,
  BsQuestionCircleFill,
  BsX,
} from "react-icons/bs";
import { cn } from "@/lib/utils";
import { FilePickerModal } from "@/components/media/FilePickerModal";
import { MediaPickerModal } from "@/components/media/MediaPickerModal";
import { getGroupMembers, type GroupMemberItem } from "@/app/actions/conversation";
import type { ZaloStickerItem } from "@/app/actions/zaloFriend";
import type { MediaItem } from "@/types/media";
import type { QuickReply } from "@/types/quickReply";
import { ReplyTarget } from "./MessageThread";
import { ShortcutHelpModal } from "./ShortcutHelpModal";
import { ZaloStickerPickerModal } from "./ZaloStickerPickerModal";

interface AttachedFile {
  url: string;
  name: string;
  // true nếu file chọn từ FilePickerModal có resourceType="video" — quyết
  // định lưu Message.attachments[].type là "video" hay "file" (xem
  // InboxView.tsx#handleSend), để MessageThread.tsx render đúng player thay
  // vì chỉ hiện link tải chung chung.
  isVideo?: boolean;
}

interface MessageComposerProps {
  onSend: (
    text: string,
    imageUrls: string[],
    replyToMessageId?: string,
    file?: AttachedFile,
    sticker?: { id: number; cateId: number; type: number; previewUrl: string },
    mentions?: { uid: string; pos: number; len: number }[]
  ) => void | Promise<void>;
  // Mẫu trả lời nhanh của Shop — gõ "/" + ký tự tắt để gợi ý, hoặc bấm nút
  // ghi chú (StickyNote) để xem toàn bộ danh sách, xem
  // slashQuery/quickReplyDropdownItems bên dưới.
  quickReplies?: QuickReply[];
  // Đang trả lời trích dẫn 1 tin nào đó (bấm nút Trả lời trong MessageThread)
  // — controlled từ InboxView, không phải state nội bộ, vì cả 2 nơi
  // (MessageThread bấm chọn, InboxView xoá sau khi gửi) đều cần đọc/ghi.
  replyingTo?: ReplyTarget | null;
  onCancelReply?: () => void;
  // Gửi nhãn dán CHỈ Zalo hỗ trợ (xem ZaloStickerPickerModal.tsx) — cần
  // pageId (Mongo _id ConnectedPage, KHÔNG phải externalPageId) của ĐÚNG Page
  // đang chat để gọi API tìm sticker. Thiếu 1 trong 2 thì ẩn hẳn nút, không
  // hiện nút disable vô nghĩa.
  canSendSticker?: boolean;
  zaloPageId?: string;
  // "@nhắc tên" thành viên — chỉ nhóm Zalo hỗ trợ (xem
  // server/src/services/channels/types.ts#ChannelMentionRef). Cần
  // conversationId để tải danh sách thành viên nhóm đó — thiếu 1 trong 2 thì
  // gõ "@" chỉ ra chữ thường, không hiện dropdown.
  canMention?: boolean;
  conversationId?: string;
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

// Custom Tooltip bong bóng đen cho các nút icon soạn tin — khớp thiết kế chuẩn (Video và Tài liệu, Sticker, v.v.)
function ComposerTooltip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="group relative flex items-center justify-center">
      {children}
      <div className="pointer-events-none absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 scale-95 transition-all duration-150 group-hover:opacity-100 group-hover:scale-100 z-30">
        <div className="relative rounded-lg bg-[#1c2433] px-3 py-1.5 text-xs font-medium text-white shadow-xl whitespace-nowrap">
          {label}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#1c2433]" />
        </div>
      </div>
    </div>
  );
}

// Cho phép component cha (InboxView) tự điền text vào ô soạn tin từ bên
// ngoài — dùng khi bấm 1 gợi ý trong AiSuggestionBar. value là state nội bộ
// (không controlled từ prop) nên cần expose qua ref thay vì 1 prop `value`.
export interface MessageComposerHandle {
  setText: (text: string) => void;
}

export const MessageComposer = React.forwardRef<MessageComposerHandle, MessageComposerProps>(
  function MessageComposer(
    {
      onSend,
      quickReplies = [],
      replyingTo,
      onCancelReply,
      canSendSticker,
      zaloPageId,
      canMention,
      conversationId,
    },
    ref
  ) {
    const [value, setValue] = React.useState("");
    const [isSending, setIsSending] = React.useState(false);
    const [pickerOpen, setPickerOpen] = React.useState(false);
    const [filePickerOpen, setFilePickerOpen] = React.useState(false);
    const [stickerPickerOpen, setStickerPickerOpen] = React.useState(false);
    const [shortcutHelpOpen, setShortcutHelpOpen] = React.useState(false);
    const [attachedImages, setAttachedImages] = React.useState<MediaItem[]>([]);
    // File đính kèm bất kỳ (không phải ảnh) — đúng 1 file/lượt gửi, khác
    // attachedImages (nhiều ảnh, chọn từ thư viện). Chọn từ FilePickerModal
    // (đã upload sẵn trong thư viện, hoặc vừa upload xong ngay trong đó), không
    // tự upload trực tiếp ở đây nữa.
    const [attachedFile, setAttachedFile] = React.useState<AttachedFile | null>(null);
    // Bấm nút StickyNote để tự mở XEM HẾT danh sách mẫu (không cần gõ "/") —
    // khác slashQuery (tự mở khi đang gõ, lọc theo ký tự tắt).
    const [manualListOpen, setManualListOpen] = React.useState(false);
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);
    // Vị trí con trỏ hiện tại trong textarea — cần để biết đang gõ "@..." ở
    // ĐÚNG NGAY TRƯỚC con trỏ hay không (khác "/" chỉ cần kiểm tra đầu chuỗi,
    // "@" có thể gõ ở giữa câu bất kỳ lúc nào).
    const [cursorPos, setCursorPos] = React.useState(0);
    const [groupMembers, setGroupMembers] = React.useState<GroupMemberItem[]>([]);
    // Chỉ những người ĐÃ CHỌN qua dropdown mới được tính là mention thật khi
    // gửi (xem buildMentions) — gõ tay "@Tên" không qua dropdown thì vẫn chỉ
    // là chữ thường, không nhắc được ai.
    const [mentionedMembers, setMentionedMembers] = React.useState<GroupMemberItem[]>([]);

    React.useImperativeHandle(ref, () => ({
      setText: (text: string) => setValue(text),
    }));

    // Đổi hội thoại thì reset — setState thường trong thân render (an toàn,
    // mirror MediaPickerModal.tsx/CustomerInfoPanel.tsx), KHÔNG đặt trong
    // effect.
    const [prevConversationId, setPrevConversationId] = React.useState(conversationId);
    if (conversationId !== prevConversationId) {
      setPrevConversationId(conversationId);
      setMentionedMembers([]);
      setGroupMembers([]);
    }

    // Tải danh sách thành viên nhóm khi đổi hội thoại — hàm fetch khai báo
    // NGAY TRONG effect (không qua useCallback ở ngoài) để ESLint rule
    // react-hooks/set-state-in-effect không coi nhầm là setState đồng bộ, xem
    // CustomerInfoPanel.tsx.
    React.useEffect(() => {
      if (!canMention || !conversationId) return;
      async function run() {
        const items = await getGroupMembers(conversationId!);
        setGroupMembers(items);
      }
      void run();
    }, [canMention, conversationId]);

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

    // Đang gõ "@..." NGAY TRƯỚC con trỏ (chưa gặp khoảng trắng/xuống dòng nào
    // kể từ dấu "@" gần nhất) — khác "/" chỉ cần kiểm tra đầu chuỗi, "@" có
    // thể xuất hiện ở BẤT KỲ đâu giữa câu, nên phải tính theo vị trí con trỏ
    // thật, không phải theo đầu chuỗi.
    const atQuery = React.useMemo(() => {
      if (!canMention) return null;
      const uptoCursor = value.slice(0, cursorPos);
      const atIndex = uptoCursor.lastIndexOf("@");
      if (atIndex === -1) return null;
      const between = uptoCursor.slice(atIndex + 1);
      if (/[\s]/.test(between)) return null;
      return between;
    }, [canMention, value, cursorPos]);

    const mentionDropdownItems =
      atQuery !== null
        ? groupMembers.filter((m) => m.name.toLowerCase().includes(atQuery.toLowerCase())).slice(0, 6)
        : [];

    // Chèn "@Tên " vào đúng vị trí con trỏ, thay cho phần "@..." đang gõ dở —
    // nhớ lại người này để lúc gửi tính ra đúng pos/len (xem buildMentions).
    function applyMention(member: GroupMemberItem) {
      const uptoCursor = value.slice(0, cursorPos);
      const atIndex = uptoCursor.lastIndexOf("@");
      if (atIndex === -1) return;
      const before = value.slice(0, atIndex);
      const after = value.slice(cursorPos);
      const inserted = `@${member.name} `;
      const newValue = before + inserted + after;
      const newCursorPos = before.length + inserted.length;
      setValue(newValue);
      setCursorPos(newCursorPos);
      setMentionedMembers((prev) => [...prev, member]);
      requestAnimationFrame(() => {
        textareaRef.current?.setSelectionRange(newCursorPos, newCursorPos);
        textareaRef.current?.focus();
      });
    }

    // Tính pos/len của từng mention ĐÃ CHỌN trong chuỗi text CUỐI CÙNG sẽ gửi
    // — tìm đúng chuỗi "@Tên" trong text đó, không tự theo dõi vị trí realtime
    // lúc gõ (đơn giản hơn nhiều, đủ dùng cho trường hợp thường gặp — chọn từ
    // dropdown, không tự gõ tay/sửa giữa tên). Không tìm thấy nữa (vd đã xoá)
    // thì bỏ qua âm thầm, không chặn gửi.
    function buildMentions(text: string): { uid: string; pos: number; len: number }[] {
      const mentions: { uid: string; pos: number; len: number }[] = [];
      for (const member of mentionedMembers) {
        const marker = `@${member.name}`;
        const pos = text.indexOf(marker);
        if (pos !== -1) mentions.push({ uid: member.uid, pos, len: marker.length });
      }
      return mentions;
    }

    async function handleSend() {
      const trimmedText = value.trim();
      if ((!trimmedText && attachedImages.length === 0 && !attachedFile) || isSending) return;

      const imageUrls = attachedImages.map((item) => item.url);
      const replyToMessageId = replyingTo?.id;
      const file = attachedFile ?? undefined;
      const mentions = trimmedText ? buildMentions(trimmedText) : undefined;
      setValue("");
      setAttachedImages([]);
      setAttachedFile(null);
      setMentionedMembers([]);
      onCancelReply?.();
      setIsSending(true);
      try {
        await onSend(trimmedText, imageUrls, replyToMessageId, file, undefined, mentions);
      } finally {
        setIsSending(false);
      }
    }

    // Gửi NGAY khi bấm chọn 1 sticker (không có bước "đính kèm rồi bấm Gửi"
    // như ảnh/file khác) — đúng hành vi quen thuộc của app chat thật.
    async function handleSendSticker(sticker: ZaloStickerItem) {
      if (isSending) return;
      const replyToMessageId = replyingTo?.id;
      onCancelReply?.();
      setIsSending(true);
      try {
        await onSend("", [], replyToMessageId, undefined, sticker);
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

    function handlePickFile(item: MediaItem) {
      setAttachedFile({
        url: item.url,
        name: item.originalFilename,
        isVideo: item.resourceType === "video",
      });
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
        {attachedFile && (
          <div className="mb-2 flex items-center gap-2 rounded-lg bg-slate-100 p-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white text-slate-500">
              <BsFileEarmarkFill className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1 truncate text-xs text-slate-600">{attachedFile.name}</span>
            {attachedFile && (
              <button
                type="button"
                onClick={() => setAttachedFile(null)}
                aria-label={`Bỏ ${attachedFile.name}`}
                className="flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600"
              >
                <BsX className="h-3.5 w-3.5" />
              </button>
            )}
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

          {quickReplyDropdownItems.length === 0 && mentionDropdownItems.length > 0 && (
            <div className="absolute bottom-full left-0 z-20 mb-1.5 max-h-72 w-full max-w-sm overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
              {mentionDropdownItems.map((member) => (
                <button
                  key={member.uid}
                  type="button"
                  onClick={() => applyMention(member)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-slate-50 cursor-pointer"
                >
                  {member.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={member.avatarUrl}
                      alt={member.name}
                      className="h-7 w-7 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-300 text-xs font-bold text-white">
                      {member.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800">
                    {member.name}
                  </span>
                </button>
              ))}
            </div>
          )}

          <textarea
            ref={textareaRef}
            rows={1}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setCursorPos(e.target.selectionStart);
            }}
            onClick={(e) => setCursorPos(e.currentTarget.selectionStart)}
            onKeyUp={(e) => setCursorPos(e.currentTarget.selectionStart)}
            onKeyDown={(e) => {
              if (quickReplyDropdownItems.length > 0 && (e.key === "Enter" || e.key === "Tab")) {
                e.preventDefault();
                applyQuickReply(quickReplyDropdownItems[0]);
                return;
              }
              if (mentionDropdownItems.length > 0 && (e.key === "Enter" || e.key === "Tab")) {
                e.preventDefault();
                applyMention(mentionDropdownItems[0]);
                return;
              }
              // Enter thường -> gửi. Shift+Enter -> để mặc định trình duyệt tự
              // xuống dòng trong textarea (không preventDefault).
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={
              canMention
                ? "Nhập tin nhắn... (gõ / để chèn mẫu, @ để nhắc tên, Shift+Enter để xuống dòng)"
                : "Nhập tin nhắn... (gõ / để chèn mẫu trả lời nhanh, Shift+Enter để xuống dòng)"
            }
            className="block w-full resize-none overflow-y-auto border-none bg-transparent py-1.5 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
        </div>

        <div className="mt-1 flex items-center justify-between">
          <div className="flex items-center gap-1 text-slate-400">
            <ComposerTooltip label="Phím tắt & Hướng dẫn">
              <button
                type="button"
                onClick={() => setShortcutHelpOpen(true)}
                aria-label="Hướng dẫn & Phím tắt"
                className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
              >
                <BsQuestionCircleFill className="h-4.5 w-4.5" />
              </button>
            </ComposerTooltip>
          </div>

          <div className="flex items-center gap-1 text-slate-400">
            {canSendSticker && zaloPageId && (
              <ComposerTooltip label="Sticker">
                <button
                  type="button"
                  onClick={() => setStickerPickerOpen(true)}
                  aria-label="Gửi nhãn dán"
                  className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
                >
                  <BsStickyFill className="h-4.5 w-4.5" />
                </button>
              </ComposerTooltip>
            )}
            <ComposerTooltip label="Video và Tài liệu">
              <button
                type="button"
                onClick={() => setFilePickerOpen(true)}
                aria-label="Đính kèm file"
                className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
              >
                <BsPaperclip className="h-4.5 w-4.5" />
              </button>
            </ComposerTooltip>
            <ComposerTooltip label="Hình ảnh">
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
            </ComposerTooltip>
            <ComposerTooltip label="Mẫu trả lời nhanh">
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
            </ComposerTooltip>
            <ComposerTooltip label="Gửi tin nhắn">
              <button
                type="button"
                onClick={handleSend}
                disabled={isSending}
                aria-label="Gửi tin nhắn"
                className="flex h-8 w-8 items-center justify-center rounded-full text-primary transition-colors hover:bg-primary/10 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
              >
                <BsSendFill className="h-4.5 w-4.5" />
              </button>
            </ComposerTooltip>
          </div>
        </div>

        <MediaPickerModal open={pickerOpen} onClose={() => setPickerOpen(false)} onSelect={handlePickImages} />
        <FilePickerModal
          open={filePickerOpen}
          onClose={() => setFilePickerOpen(false)}
          onSelect={handlePickFile}
        />
        {canSendSticker && zaloPageId && (
          <ZaloStickerPickerModal
            open={stickerPickerOpen}
            onClose={() => setStickerPickerOpen(false)}
            pageId={zaloPageId}
            onSelect={handleSendSticker}
          />
        )}
        <ShortcutHelpModal open={shortcutHelpOpen} onClose={() => setShortcutHelpOpen(false)} />
      </div>
    );
  }
);
