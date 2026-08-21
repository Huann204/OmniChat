"use client";

import * as React from "react";
import { BsSearch, BsStickyFill } from "react-icons/bs";
import { Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { toast } from "@/store/toast-store";
import { searchZaloStickers, type ZaloStickerItem } from "@/app/actions/zaloFriend";

// zca-js không có API "lấy sticker mặc định/hay dùng" — tự tìm sẵn theo 1 từ
// khoá phổ biến ngay lúc mở modal để có vài gợi ý ban đầu thay vì trống trơn,
// KHÔNG phải danh sách "mặc định" thật của Zalo.
const DEFAULT_STICKER_KEYWORD = "cười";

// Modal tìm + gửi nhãn dán Zalo — khác các modal Zalo khác (không cần chọn
// Page, vì luôn dùng ĐÚNG Page của hội thoại đang mở, xem MessageComposer.tsx).
// Bấm vào 1 sticker là gửi NGAY (không có bước "đính kèm rồi bấm Gửi" như
// ảnh/file khác) — đúng hành vi quen thuộc của app chat thật (Zalo/Messenger).
export function ZaloStickerPickerModal({
  open,
  onClose,
  pageId,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  pageId: string;
  onSelect: (sticker: ZaloStickerItem) => void;
}) {
  const [keyword, setKeyword] = React.useState("");
  const [items, setItems] = React.useState<ZaloStickerItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  // Debounce bằng setTimeout ref (không dùng effect cho việc gọi API) — khớp
  // quy ước tìm kiếm đã dùng ở ConversationList.
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset khi vừa mở lại modal — setState thường trong thân render (mirror
  // MediaPickerModal.tsx).
  const [prevOpen, setPrevOpen] = React.useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setKeyword("");
      setItems([]);
    }
  }

  // Tự tìm sẵn 1 lượt theo từ khoá mặc định mỗi khi vừa mở modal — hàm fetch
  // khai báo NGAY TRONG effect (không qua useCallback ở ngoài) để ESLint rule
  // react-hooks/set-state-in-effect không coi nhầm là setState đồng bộ, mirror
  // ZaloFriendListModal.tsx.
  React.useEffect(() => {
    if (!open) return;
    async function run() {
      setLoading(true);
      const result = await searchZaloStickers(pageId, DEFAULT_STICKER_KEYWORD);
      setLoading(false);
      // Lỗi ở lượt tìm MẶC ĐỊNH này chỉ bỏ qua âm thầm (chỉ là gợi ý ban đầu,
      // không phải người dùng chủ động tìm) — không làm phiền bằng toast.
      if (!result.error) setItems(result.items);
    }
    void run();
  }, [open, pageId]);

  async function runSearch(value: string) {
    if (!value.trim()) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const result = await searchZaloStickers(pageId, value);
    setLoading(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    setItems(result.items);
  }

  function handleKeywordChange(value: string) {
    setKeyword(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(value), 350);
  }

  function handleSelect(item: ZaloStickerItem) {
    onSelect(item);
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Gửi nhãn dán">
      <div className="flex h-[60vh] flex-col p-5">
        <div className="relative mb-3 shrink-0">
          <BsSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            autoFocus
            value={keyword}
            onChange={(e) => handleKeywordChange(e.target.value)}
            placeholder="Tìm nhãn dán, vd: cười, buồn, chào..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-white"
          />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
            </div>
          ) : items.length > 0 ? (
            <div className="grid grid-cols-4 gap-2">
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item)}
                  aria-label="Gửi nhãn dán này"
                  className="flex aspect-square items-center justify-center rounded-lg p-1.5 transition-colors hover:bg-slate-100 cursor-pointer"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.previewUrl} alt="" className="h-full w-full object-contain" />
                </button>
              ))}
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
              <BsStickyFill className="h-8 w-8 text-slate-200" />
              <p className="text-sm text-slate-400">
                {keyword.trim() ? "Không tìm thấy nhãn dán nào khớp." : "Gõ từ khoá để tìm nhãn dán."}
              </p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
