"use client";

import * as React from "react";
import {
  BsFileEarmarkPdfFill,
  BsFileEarmarkFill,
  BsPlayCircleFill,
  BsSearch,
  BsTrashFill,
} from "react-icons/bs";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useFileLibraryData } from "@/hooks/useFileLibraryData";
import { useFileUpload } from "@/hooks/useFileUpload";
import { formatBytes } from "@/lib/media";
import type { MediaItem } from "@/types/media";

interface FilePickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (item: MediaItem) => void;
}

// Nhãn hiện dưới tên file — khớp cách Messenger hiện "Tệp video · 17.8 MB",
// "Tệp PDF · 309.2 KB" trong màn "Tệp và video âm thanh" (đây là màn tham
// chiếu UI cho component này).
function typeLabel(item: MediaItem): string {
  if (item.resourceType === "video") return "Tệp video";
  if (item.format) return `Tệp ${item.format.toUpperCase()}`;
  return "Tệp";
}

function FileThumbnail({ item }: { item: MediaItem }) {
  if (item.resourceType === "video") {
    return (
      <span className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-800">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.url} alt="" className="h-full w-full object-cover opacity-70" />
        <BsPlayCircleFill className="absolute h-6 w-6 text-white" />
      </span>
    );
  }
  if (item.format === "pdf") {
    return (
      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white">
        <BsFileEarmarkPdfFill className="h-6 w-6 text-red-500" />
      </span>
    );
  }
  return (
    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white">
      <BsFileEarmarkFill className="h-6 w-6 text-slate-400" />
    </span>
  );
}

// Thư viện "Tệp và video" dùng chung cho khung chat — khác MediaPickerModal
// (thư viện ảnh, hiện dạng lưới ảnh) vì file/video không xem trước được kiểu
// đó, hiện dạng danh sách (tên + loại + dung lượng) giống Messenger. Chỉ
// chọn được 1 item/lần (khác ảnh cho phép nhiều) — khớp đúng 1 file/tin nhắn
// ở server (xem conversation.controller.ts#parseSendParts).
export function FilePickerModal({ open, onClose, onSelect }: FilePickerModalProps) {
  const [search, setSearch] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);
  // id đang chờ xác nhận xoá — mở dialog xác nhận riêng thay vì xoá thẳng
  // khi bấm nút thùng rác, tránh xoá nhầm (không phục hồi lại được).
  const [pendingDeleteId, setPendingDeleteId] = React.useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = React.useState(false);

  const { items, page, pages, loading, loadingMore, deletingId, loadMore, addUploaded, removeItem } =
    useFileLibraryData(search);
  const { pending, addFiles } = useFileUpload(addUploaded);

  // Reset tìm kiếm mỗi lần mở lại modal — tránh giữ bộ lọc từ lần mở trước.
  const [prevOpen, setPrevOpen] = React.useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setSearch("");
  }

  function handleSelect(item: MediaItem) {
    onSelect(item);
    onClose();
  }

  async function handleConfirmDelete() {
    if (!pendingDeleteId || confirmingDelete) return;
    setConfirmingDelete(true);
    await removeItem(pendingDeleteId);
    setConfirmingDelete(false);
    setPendingDeleteId(null);
  }

  const showEmptyState = !loading && items.length === 0 && pending.length === 0;

  return (
    <Modal open={open} onClose={onClose} className="flex h-[min(80vh,640px)] w-full max-w-lg flex-col">
      <div className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
        <h2 className="text-base font-semibold text-slate-900">Tệp và video âm thanh</h2>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="shrink-0 cursor-pointer text-sm font-semibold text-primary hover:underline"
        >
          Thêm mới
        </button>
      </div>

      <div className="shrink-0 border-b border-slate-200 p-3">
        <div className="relative">
          <BsSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-white"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {pending.map((p) => (
          <div key={p.id} className="flex items-center gap-3 rounded-xl px-2 py-2.5">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white">
              <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-900">{p.file.name}</p>
              <p className="text-xs text-slate-400">Đang tải lên...</p>
            </div>
          </div>
        ))}

        {showEmptyState ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 py-10 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-300">
              <BsFileEarmarkFill className="h-8 w-8" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">Bạn chưa có file nào.</p>
              <p className="text-sm text-slate-400">Bấm &quot;Thêm mới&quot; để tải file lên</p>
            </div>
          </div>
        ) : (
          <>
            {items.map((item) => (
              <div
                key={item.id}
                className="group flex items-center gap-1 rounded-xl transition-colors hover:bg-slate-50"
              >
                <button
                  type="button"
                  onClick={() => handleSelect(item)}
                  className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 px-2 py-2.5 text-left"
                >
                  <FileThumbnail item={item} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {item.originalFilename}
                    </p>
                    <p className="text-xs text-slate-400">
                      {typeLabel(item)} · {formatBytes(item.bytes)}
                    </p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setPendingDeleteId(item.id)}
                  disabled={deletingId === item.id}
                  aria-label={`Xoá ${item.originalFilename}`}
                  className="mr-2 flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-slate-300 opacity-0 transition-colors hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 disabled:cursor-not-allowed"
                >
                  {deletingId === item.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <BsTrashFill className="h-4 w-4" />
                  )}
                </button>
              </div>
            ))}
            {!loading && page < pages && (
              <div className="mt-3 flex justify-center">
                <Button variant="outline" size="sm" onClick={loadMore} disabled={loadingMore}>
                  {loadingMore && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                  Tải thêm
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        // HTML accept không hỗ trợ "loại trừ" (không thể ghi "không phải
        // ảnh") — liệt kê thẳng các loại thường gặp NGOÀI ảnh để hộp thoại hệ
        // điều hành tự lọc bớt, chỉ là gợi ý hiển thị (người dùng vẫn bấm
        // được "Tất cả file" để lách qua) — chặn thật vẫn nằm ở
        // useFileUpload.ts (client) và upload.middleware.ts (server).
        accept="video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.7z,.txt,.csv,.json"
        className="hidden"
        onChange={(e) => {
          addFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {pendingDeleteId && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-start gap-3">
              <BsTrashFill className="h-5 w-5 shrink-0 text-red-500" />
              <p className="text-sm font-medium text-slate-900">
                Bạn có chắc chắn muốn xoá file này không?
              </p>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPendingDeleteId(null)}
                disabled={confirmingDelete}
                className="cursor-pointer rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={confirmingDelete}
                className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {confirmingDelete && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Xoá file
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
