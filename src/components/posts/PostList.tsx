"use client";

import * as React from "react";
import Link from "next/link";
import { BsTrashFill, BsExclamationCircleFill, BsPencilFill, BsBoxArrowUpRight } from "react-icons/bs";
import { Loader2 } from "lucide-react";
import { deletePost, type PostItem } from "@/app/actions/post";
import { toast } from "@/store/toast-store";

interface PostListProps {
  posts: PostItem[];
  emptyLabel: string;
  // Bài đã đăng thật (có facebookPostId) thì nút xoá sẽ gỡ THẬT trên
  // Facebook — đổi label/xác nhận cho rõ, tránh user tưởng chỉ ẩn khỏi danh
  // sách trong app (xem post.controller.ts#deletePost).
}

export function PostList({ posts, emptyLabel }: PostListProps) {
  const [items, setItems] = React.useState(posts);
  const [confirmId, setConfirmId] = React.useState<string | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const confirmTarget = items.find((p) => p.id === confirmId);

  async function handleDelete(id: string) {
    setDeletingId(id);
    const { success, error } = await deletePost(id);
    setDeletingId(null);
    setConfirmId(null);
    if (!success) {
      toast.error(error || "Không xoá được bài viết");
      return;
    }
    setItems((prev) => prev.filter((p) => p.id !== id));
    toast.success("Đã xoá bài viết");
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200/70 bg-white p-8 text-center shadow-[8px]">
        <p className="text-sm text-slate-500">{emptyLabel}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((post) => (
        <div
          key={post.id}
          className="flex items-start gap-3 rounded-2xl border border-slate-200/70 bg-white p-4 shadow-[8px]"
        >
          {post.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.imageUrl} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover" />
          )}
          <div className="min-w-0 flex-1">
            <p className="whitespace-pre-wrap text-sm text-slate-800">{post.content}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
              {post.scheduledFor && (
                <span>Hẹn đăng: {new Date(post.scheduledFor).toLocaleString("vi-VN")}</span>
              )}
              {post.publishedAt && (
                <span>Đã đăng: {new Date(post.publishedAt).toLocaleString("vi-VN")}</span>
              )}
            </div>
            {post.status === "failed" && post.errorMessage && (
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-500">
                <BsExclamationCircleFill className="h-3.5 w-3.5 shrink-0" />
                {post.errorMessage}
              </p>
            )}
            {post.status === "published" && post.facebookPostId && (
              <a
                href={`https://www.facebook.com/${post.facebookPostId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
              >
                <BsBoxArrowUpRight className="h-3 w-3" /> Xem trên Facebook
              </a>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-1">
            {post.status === "draft" && (
              <Link
                href={`/posts/compose?draftId=${post.id}`}
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
              >
                <BsPencilFill className="h-3.5 w-3.5" /> Chỉnh sửa
              </Link>
            )}
            <button
              type="button"
              onClick={() => setConfirmId(post.id)}
              className="cursor-pointer rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
              aria-label="Xoá bài viết"
            >
              <BsTrashFill className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}

      {confirmTarget && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setConfirmId(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <BsTrashFill className="h-5 w-5 shrink-0 text-red-500" />
              <p className="text-sm font-medium text-slate-900">
                {confirmTarget.facebookPostId
                  ? "Bài viết này đã đăng lên Facebook — xoá sẽ gỡ THẬT bài viết trên Facebook, không thể hoàn tác."
                  : "Xoá bài viết này? Không thể hoàn tác."}
              </p>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmId(null)}
                disabled={deletingId !== null}
                className="cursor-pointer rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Huỷ
              </button>
              <button
                type="button"
                onClick={() => handleDelete(confirmTarget.id)}
                disabled={deletingId !== null}
                className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deletingId === confirmTarget.id && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Xoá
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
