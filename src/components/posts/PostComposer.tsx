"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { BsImageFill, BsX, BsSendFill, BsFillClockFill, BsFileEarmarkText } from "react-icons/bs";
import { Loader2 } from "lucide-react";
import { MediaPickerModal } from "@/components/media/MediaPickerModal";
import { createPost } from "@/app/actions/post";
import { toast } from "@/store/toast-store";
import type { Bot } from "@/types/bot";
import type { MediaItem } from "@/types/media";

interface PostComposerProps {
  facebookPages: Bot[];
}

type SubmitMode = "publish" | "schedule" | "draft";

// v1 chỉ hỗ trợ 0 hoặc 1 ảnh/bài (xem plan) — MediaPickerModal multiple=false
// nên luôn trả về đúng 1 item.
export function PostComposer({ facebookPages }: PostComposerProps) {
  const router = useRouter();
  const [pageId, setPageId] = React.useState(facebookPages[0]?.id ?? "");
  const [content, setContent] = React.useState("");
  const [image, setImage] = React.useState<MediaItem | null>(null);
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [scheduledFor, setScheduledFor] = React.useState("");
  // Lazy initializer — chỉ tính 1 lần lúc mount, tránh gọi Date.now() (hàm
  // impure) trực tiếp trong thân render.
  const [minScheduleTime] = React.useState(() =>
    new Date(Date.now() + 60_000).toISOString().slice(0, 16)
  );
  const [showSchedulePicker, setShowSchedulePicker] = React.useState(false);
  const [submitting, setSubmitting] = React.useState<SubmitMode | null>(null);

  function reset() {
    setContent("");
    setImage(null);
    setScheduledFor("");
    setShowSchedulePicker(false);
  }

  async function handleSubmit(mode: SubmitMode) {
    if (!pageId) {
      toast.error("Vui lòng chọn Page");
      return;
    }
    if (!content.trim()) {
      toast.error("Vui lòng nhập nội dung bài viết");
      return;
    }
    if (mode === "schedule" && !scheduledFor) {
      toast.error("Vui lòng chọn thời gian hẹn đăng");
      return;
    }

    setSubmitting(mode);
    const { post, error } = await createPost({
      pageId,
      content,
      imageUrl: image?.url,
      mode,
      scheduledFor: mode === "schedule" ? new Date(scheduledFor).toISOString() : undefined,
    });
    setSubmitting(null);

    if (!post) {
      toast.error(error || "Có lỗi xảy ra");
      return;
    }

    if (mode === "publish") {
      toast.success("Đã đăng bài thành công");
      router.push("/posts/history");
    } else if (mode === "schedule") {
      toast.success("Đã lên lịch đăng bài");
      router.push("/posts/scheduled");
    } else {
      toast.success("Đã lưu nháp");
      router.push("/posts/drafts");
    }
    reset();
  }

  if (facebookPages.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200/70 bg-white p-8 text-center shadow-[8px]">
        <p className="text-sm text-slate-500">
          Chưa có Page Facebook nào được kết nối — kết nối 1 Page ở Dashboard trước khi soạn bài.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200/70 bg-white p-4 shadow-[8px] md:p-5">
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-700 sm:text-sm">Đăng lên Page</label>
        <select
          value={pageId}
          onChange={(e) => setPageId(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          {facebookPages.map((page) => (
            <option key={page.id} value={page.id}>
              {page.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-700 sm:text-sm">Nội dung</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Bạn đang nghĩ gì?"
          rows={6}
          className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>

      {image ? (
        <div className="relative inline-block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image.url} alt="" className="h-32 w-32 rounded-xl object-cover" />
          <button
            type="button"
            onClick={() => setImage(null)}
            className="absolute -right-2 -top-2 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-slate-800 text-white shadow"
            aria-label="Bỏ ảnh"
          >
            <BsX className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
        >
          <BsImageFill className="h-4 w-4" /> Thêm ảnh
        </button>
      )}

      {showSchedulePicker && (
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 sm:text-sm">Thời gian đăng</label>
          <input
            type="datetime-local"
            value={scheduledFor}
            onChange={(e) => setScheduledFor(e.target.value)}
            min={minScheduleTime}
            className="w-full max-w-xs rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
        <button
          type="button"
          onClick={() => handleSubmit("publish")}
          disabled={submitting !== null}
          className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/20 transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting === "publish" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <BsSendFill className="h-3.5 w-3.5" />
          )}
          Đăng ngay
        </button>

        {showSchedulePicker ? (
          <button
            type="button"
            onClick={() => handleSubmit("schedule")}
            disabled={submitting !== null}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting === "schedule" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <BsFillClockFill className="h-3.5 w-3.5" />
            )}
            Xác nhận hẹn giờ
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setShowSchedulePicker(true)}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
          >
            <BsFillClockFill className="h-3.5 w-3.5" /> Hẹn giờ
          </button>
        )}

        <button
          type="button"
          onClick={() => handleSubmit("draft")}
          disabled={submitting !== null}
          className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting === "draft" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <BsFileEarmarkText className="h-3.5 w-3.5" />
          )}
          Lưu nháp
        </button>
      </div>

      <MediaPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        multiple={false}
        onSelect={(items) => {
          setImage(items[0] ?? null);
          setPickerOpen(false);
        }}
      />
    </div>
  );
}
