"use client";

import * as React from "react";
import { toast } from "@/store/toast-store";
import type { MediaItem, MediaUploadFailure } from "@/types/media";

const MAX_FILES = 10;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export interface PendingUpload {
  id: string;
  file: File;
}

// Y hệt useMediaUpload nhưng nhận file BẤT KỲ (không chỉ ảnh) — dùng cho
// FilePickerModal, tải lên /api/media/upload-files thay vì /api/media/upload.
export function useFileUpload(onUploaded: (items: MediaItem[]) => void) {
  const [pending, setPending] = React.useState<PendingUpload[]>([]);

  async function uploadFiles(batch: PendingUpload[]) {
    const formData = new FormData();
    batch.forEach((p) => formData.append("files", p.file));

    try {
      const res = await fetch("/api/media/upload-files", { method: "POST", body: formData });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        toast.error(data?.message || "Upload thất bại");
        return;
      }

      const items: MediaItem[] = data?.items ?? [];
      const failed: MediaUploadFailure[] = data?.failed ?? [];

      if (items.length > 0) {
        onUploaded(items);
        toast.success(`Đã upload ${items.length} file`);
      }
      failed.forEach((f) => toast.error(`"${f.filename}": ${f.error}`));
    } catch {
      toast.error("Không kết nối được máy chủ để upload");
    } finally {
      setPending((prev) => prev.filter((p) => !batch.some((b) => b.id === p.id)));
    }
  }

  function addFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);

    if (pending.length + files.length > MAX_FILES) {
      toast.error(`Chỉ chọn tối đa ${MAX_FILES} file mỗi lần`);
      return;
    }

    const accepted: PendingUpload[] = [];
    for (const file of files) {
      // Ảnh có thư viện riêng (MediaPickerModal) — chặn ngay ở client cho
      // phản hồi tức thì, khớp fileFilter phía server (xem
      // upload.middleware.ts#uploadAny) chặn lại lần nữa để chắc chắn.
      if (file.type.startsWith("image/")) {
        toast.error(`"${file.name}" là ảnh — dùng thư viện ảnh riêng để tải lên`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`"${file.name}" vượt quá 10MB`);
        continue;
      }
      accepted.push({
        id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
        file,
      });
    }

    if (accepted.length === 0) return;
    setPending((prev) => [...prev, ...accepted]);
    void uploadFiles(accepted);
  }

  return { pending, addFiles };
}
