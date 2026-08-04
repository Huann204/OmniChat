"use client";

import Image from "next/image";
import { Loader2, Trash2, ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatBytes } from "@/lib/media";
import type { MediaItem } from "@/types/media";

interface MediaCardProps {
  item: MediaItem;
  selected: boolean;
  selectionIndex: number | null;
  deleting: boolean;
  onToggleSelect: (item: MediaItem) => void;
  onRequestDelete: (item: MediaItem) => void;
  onPreview: (item: MediaItem) => void;
}

export function MediaCard({
  item,
  selected,
  selectionIndex,
  deleting,
  onToggleSelect,
  onRequestDelete,
  onPreview,
}: MediaCardProps) {
  return (
    <div
      className={cn(
        "group relative flex cursor-pointer flex-col overflow-hidden rounded-xl border bg-white shadow-sm transition-all",
        selected ? "border-primary ring-2 ring-primary/40" : "border-slate-200 hover:shadow-md"
      )}
      onClick={() => onToggleSelect(item)}
    >
      <div className="relative aspect-square w-full bg-slate-100">
        <Image
          src={item.url}
          alt={item.originalFilename}
          fill
          sizes="(max-width: 640px) 45vw, (max-width: 1024px) 25vw, 180px"
          // object-contain: hiện trọn vẹn ảnh trong khung vuông, không cắt (object-cover
          // sẽ crop phần thừa để lấp đầy khung).
          className="object-contain"
          // item.url đã là webp + quality auto ngay từ lúc upload (media.service.ts) —
          // không set thêm kích thước/transformation nào ở đây. unoptimized để browser
          // gọi thẳng URL Cloudinary, không qua /_next/image xử lý lại lần nữa.
          unoptimized
        />

        {selected && (
          <div className="absolute left-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-white">
            {selectionIndex}
          </div>
        )}

        <div className="absolute right-1.5 top-1.5 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            aria-label="Xem trước"
            onClick={(e) => {
              e.stopPropagation();
              onPreview(item);
            }}
            className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-sm transition-colors hover:bg-white"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            aria-label="Xoá ảnh"
            onClick={(e) => {
              e.stopPropagation();
              if (deleting) return;
              onRequestDelete(item);
            }}
            className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-sm transition-colors hover:bg-white"
          >
            {deleting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-0.5 p-2">
        <p className="truncate text-xs font-medium text-slate-700" title={item.originalFilename}>
          {item.originalFilename}
        </p>
        <p className="text-[11px] text-slate-400">{formatBytes(item.bytes)}</p>
      </div>
    </div>
  );
}
