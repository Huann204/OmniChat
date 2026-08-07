"use client";

import * as React from "react";
import { Copy, Download, ListChecks, Plus, Search, Trash2, Upload } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { toast } from "@/store/toast-store";

interface QuickReply {
  id: string;
  shortcut: string;
  message: string;
}

const INITIAL_QUICK_REPLIES: QuickReply[] = [
  {
    id: "1",
    shortcut: "cskh",
    message: "Cảm ơn bạn đã liên hệ, shop sẽ phản hồi trong ít phút nữa ạ!",
  },
];

const ICON_BTN =
  "flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700 cursor-pointer";

// Chưa có backend cho tính năng này (xem README nội bộ) — dữ liệu chỉ sống
// trong state của trang, mất khi F5. Chỉ "Thêm mẫu"/xoá là thao tác thật,
// các nút toolbar còn lại (nhập/xuất/sao chép/chọn tất cả) chỉ là placeholder
// UI theo đúng bố cục yêu cầu, chưa có logic đứng sau.
export default function ReplySupportSettingsPage() {
  const [quickReplies, setQuickReplies] = React.useState<QuickReply[]>(INITIAL_QUICK_REPLIES);
  const [search, setSearch] = React.useState("");
  const [modalOpen, setModalOpen] = React.useState(false);
  const [shortcutInput, setShortcutInput] = React.useState("");
  const [messageInput, setMessageInput] = React.useState("");

  const filtered = quickReplies.filter((q) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return q.shortcut.toLowerCase().includes(query) || q.message.toLowerCase().includes(query);
  });

  function openAddModal() {
    setShortcutInput("");
    setMessageInput("");
    setModalOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const shortcut = shortcutInput.trim();
    const message = messageInput.trim();
    if (!shortcut || !message) return;
    setQuickReplies((prev) => [...prev, { id: crypto.randomUUID(), shortcut, message }]);
    setModalOpen(false);
  }

  function handleDelete(id: string) {
    setQuickReplies((prev) => prev.filter((q) => q.id !== id));
  }

  function notImplemented() {
    toast.info("Tính năng đang được phát triển");
  }

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-slate-900">Hỗ trợ trả lời</h1>

      <div className="flex h-[calc(100vh-148px)] flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-[8px]">
        <div className="border-b border-slate-200 px-5 pt-4">
          <button
            type="button"
            className="border-b-2 border-primary px-1 pb-3 text-sm font-semibold text-primary cursor-pointer"
          >
            Trả lời nhanh
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div className="flex items-center gap-1.5">
            <button type="button" title="Chọn tất cả" onClick={notImplemented} className={ICON_BTN}>
              <ListChecks className="h-4 w-4" />
            </button>
            <button type="button" title="Nhập từ file" onClick={notImplemented} className={ICON_BTN}>
              <Upload className="h-4 w-4" />
            </button>
            <button type="button" title="Xuất file" onClick={notImplemented} className={ICON_BTN}>
              <Download className="h-4 w-4" />
            </button>
            <button type="button" title="Sao chép" onClick={notImplemented} className={ICON_BTN}>
              <Copy className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm kiếm"
                className="w-48 rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-white"
              />
            </div>
            <button
              type="button"
              onClick={openAddModal}
              className="flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Thêm mẫu
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-y border-slate-100 text-xs font-medium text-slate-400">
                <th className="w-16 px-5 py-2.5 font-medium">STT</th>
                <th className="w-40 px-5 py-2.5 font-medium">Ký tự tắt</th>
                <th className="px-5 py-2.5 font-medium">Tin nhắn</th>
                <th className="w-16 px-5 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, index) => (
                <tr
                  key={item.id}
                  className="group border-b border-slate-50 last:border-0 hover:bg-slate-50"
                >
                  <td className="px-5 py-3 text-slate-500">{index + 1}</td>
                  <td className="px-5 py-3">
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-700">
                      {item.shortcut}
                    </span>
                  </td>
                  <td className="max-w-md truncate px-5 py-3 text-slate-700">{item.message}</td>
                  <td className="px-5 py-3 text-right">
                    <button
                      type="button"
                      aria-label="Xoá mẫu"
                      onClick={() => handleDelete(item.id)}
                      className="cursor-pointer rounded-full p-1.5 text-slate-300 opacity-0 transition-colors group-hover:opacity-100 hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <p className="py-16 text-center text-sm text-slate-400">
              {quickReplies.length === 0
                ? 'Chưa có mẫu trả lời nhanh nào — bấm "Thêm mẫu" để tạo mới.'
                : "Không tìm thấy mẫu nào khớp với tìm kiếm."}
            </p>
          )}
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Thêm mẫu trả lời nhanh">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Ký tự tắt</label>
            <Input
              value={shortcutInput}
              onChange={(e) => setShortcutInput(e.target.value)}
              placeholder="vd: cskh"
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Tin nhắn</label>
            <textarea
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              rows={4}
              placeholder="Nội dung sẽ được chèn khi gõ ký tự tắt ở trên"
              className="flex w-full rounded-xl border border-slate-200/60 bg-white/50 px-4 py-2 text-sm text-slate-900 shadow-sm transition-all duration-300 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 cursor-pointer"
            >
              Huỷ
            </button>
            <button
              type="submit"
              disabled={!shortcutInput.trim() || !messageInput.trim()}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              Lưu
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
