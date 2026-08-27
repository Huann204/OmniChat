"use client";

import * as React from "react";
import {
  BsFileEarmarkPdfFill,
  BsFileEarmarkFill,
  BsPlayCircleFill,
  BsSearch,
  BsTrashFill,
  BsX,
  BsEyeFill,
} from "react-icons/bs";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useFileLibraryData } from "@/hooks/useFileLibraryData";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useStorageUsage } from "@/hooks/useStorageUsage";
import { formatBytes } from "@/lib/media";
import type { MediaItem } from "@/types/media";
import { StorageUsageBar } from "./StorageUsageBar";

const FORMAT_ACCEPT: Record<string, string> = {
  pdf: ".pdf,application/pdf",
  docx: ".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  txt: ".txt,text/plain",
};

interface FilePickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (item: MediaItem) => void;
  // Lọc chỉ hiện + chỉ cho tải lên vài đuôi file nhất định (vd
  // ["pdf","docx","txt"]) — dùng khi mở modal này để "chọn tài liệu kiến
  // thức" (xem AiChatbotBuilder.tsx) thay vì thư viện Tệp/video đầy đủ.
  formats?: string[];
  title?: string;
  emptyHint?: string;
}

// Nhãn hiện dưới tên file — khớp cách Messenger hiện "Tệp video · 17.8 MB",
// "Tệp PDF · 309.2 KB" trong màn "Tệp và video âm thanh".
function typeLabel(item: MediaItem): string {
  if (item.resourceType === "video") return "Tệp video";
  if (item.format) return `Tệp ${item.format.toUpperCase()}`;
  return "Tệp";
}

function FileThumbnail({
  item,
  onPreviewClick,
}: {
  item: MediaItem;
  onPreviewClick?: (e: React.MouseEvent) => void;
}) {
  if (item.resourceType === "video") {
    return (
      <span
        onClick={(e) => {
          if (onPreviewClick) {
            e.stopPropagation();
            onPreviewClick(e);
          }
        }}
        title="Bấm để xem trước video"
        className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-900 group/thumb"
      >
        <video
          src={`${item.url}#t=0.5`}
          className="h-full w-full object-cover opacity-75"
          muted
          preload="metadata"
        />
        <BsPlayCircleFill className="absolute h-6 w-6 text-white shadow-md transition-transform group-hover/thumb:scale-110" />
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

// Thư viện "Tệp và video" dùng chung cho khung chat — dạng danh sách (tên + loại + dung lượng).
export function FilePickerModal({ open, onClose, onSelect, formats, title, emptyHint }: FilePickerModalProps) {
  const [search, setSearch] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [pendingDeleteId, setPendingDeleteId] = React.useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = React.useState(false);
  const [previewItem, setPreviewItem] = React.useState<MediaItem | null>(null);

  const { items, page, pages, loading, loadingMore, deletingId, loadMore, addUploaded, removeItem } =
    useFileLibraryData(search, formats);
  const { pending, addFiles } = useFileUpload(addUploaded);
  const storageUsage = useStorageUsage(open, pending.length);
  const acceptAttr = formats && formats.length > 0
    ? formats.map((f) => FORMAT_ACCEPT[f] ?? `.${f}`).join(",")
    : "video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.7z,.txt,.csv,.json";

  // Reset tìm kiếm và preview mỗi lần mở lại modal
  const [prevOpen, setPrevOpen] = React.useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setSearch("");
      setPreviewItem(null);
      setPendingDeleteId(null);
    }
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
    if (previewItem?.id === pendingDeleteId) setPreviewItem(null);
    setPendingDeleteId(null);
  }

  const showEmptyState = !loading && items.length === 0 && pending.length === 0;

  return (
    <Modal open={open} onClose={onClose} className="relative flex h-[min(80vh,640px)] w-full max-w-lg flex-col overflow-hidden">
      <div className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
        <h2 className="text-base font-semibold text-slate-900">{title ?? "Tệp và video âm thanh"}</h2>
        <StorageUsageBar usage={storageUsage} />
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
              <p className="text-sm font-medium text-slate-600">{emptyHint ?? "Bạn chưa có file nào."}</p>
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
                  <FileThumbnail
                    item={item}
                    onPreviewClick={() => setPreviewItem(item)}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {item.originalFilename}
                    </p>
                    <p className="text-xs text-slate-400">
                      {typeLabel(item)} · {formatBytes(item.bytes)}
                    </p>
                  </div>
                </button>

                {item.resourceType === "video" && (
                  <button
                    type="button"
                    onClick={() => setPreviewItem(item)}
                    title="Xem trước video"
                    aria-label={`Xem trước ${item.originalFilename}`}
                    className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-primary/10 hover:text-primary"
                  >
                    <BsPlayCircleFill className="h-4 w-4" />
                  </button>
                )}

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
        accept={acceptAttr}
        className="hidden"
        onChange={(e) => {
          addFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {/* Frame Xem Trước (Video Player / Details) */}
      {previewItem && (
        <div className="absolute inset-0 z-30 flex flex-col bg-white">
          <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-3">
            <p className="truncate text-sm font-semibold text-slate-800">{previewItem.originalFilename}</p>
            <button
              type="button"
              onClick={() => setPreviewItem(null)}
              aria-label="Đóng xem trước"
              className="cursor-pointer rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            >
              <BsX className="h-5 w-5" />
            </button>
          </div>
          <div className="relative flex min-h-0 flex-1 items-center justify-center bg-slate-50 p-4 sm:p-6">
            {previewItem.resourceType === "video" ? (
              <video
                src={previewItem.url}
                controls
                autoPlay
                className="max-h-full max-w-full rounded-2xl bg-black shadow-xl border border-slate-200/80"
              />
            ) : (
              <div className="flex flex-col items-center gap-3 text-center text-slate-800">
                {previewItem.format === "pdf" ? (
                  <BsFileEarmarkPdfFill className="h-16 w-16 text-red-500" />
                ) : (
                  <BsFileEarmarkFill className="h-16 w-16 text-slate-400" />
                )}
                <p className="text-sm font-medium">{previewItem.originalFilename}</p>
                <p className="text-xs text-slate-500">{formatBytes(previewItem.bytes)}</p>
                <a
                  href={previewItem.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                >
                  <BsEyeFill className="h-3.5 w-3.5" />
                  Mở tệp trong tab mới
                </a>
              </div>
            )}
          </div>
          <div className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-200 px-5 py-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const id = previewItem.id;
                setPendingDeleteId(id);
              }}
            >
              Xoá file
            </Button>
            <Button
              size="sm"
              onClick={() => {
                const item = previewItem;
                setPreviewItem(null);
                handleSelect(item);
              }}
            >
              Chọn file này
            </Button>
          </div>
        </div>
      )}

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
