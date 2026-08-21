"use client";

import * as React from "react";
import { BsPencilFill, BsPinFill, BsPlusLg, BsTrashFill, BsX } from "react-icons/bs";
import { cn } from "@/lib/utils";
import { formatTimeLabel } from "@/lib/message-format";
import { toast } from "@/store/toast-store";
import {
  createConversationNote,
  deleteConversationNote,
  listConversationNotes,
  updateConversationNote,
  type ConversationNoteItem,
} from "@/app/actions/conversationNote";

type InfoTab = "info" | "order";

interface CustomerInfoPanelProps {
  hasActiveConversation?: boolean;
  conversationId?: string;
  onClose?: () => void;
  className?: string;
}



export function CustomerInfoPanel({
  hasActiveConversation = true,
  conversationId,
  onClose,
  className,
}: CustomerInfoPanelProps) {
  const [tab, setTab] = React.useState<InfoTab>("info");
  const [notes, setNotes] = React.useState<ConversationNoteItem[] | null>(null);
  const [newText, setNewText] = React.useState("");
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editingText, setEditingText] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const loadNotes = React.useCallback(async (id: string) => {
    const items = await listConversationNotes(id);
    setNotes(items);
  }, []);

  // Đổi hội thoại thì reset form — chỉ setState thường (an toàn lúc render,
  // mirror MediaPickerModal.tsx).
  const [prevConversationId, setPrevConversationId] = React.useState(conversationId);
  if (conversationId !== prevConversationId) {
    setPrevConversationId(conversationId);
    setNotes(null);
    setNewText("");
    setEditingId(null);
  }

  // Tải ghi chú khi đổi hội thoại — hàm fetch khai báo NGAY TRONG effect
  // (không gọi loadNotes ở trên) để ESLint rule react-hooks/set-state-in-effect
  // không coi nhầm là setState đồng bộ trong effect (dò theo closure), mirror
  // ZaloFriendListModal.tsx.
  React.useEffect(() => {
    if (!conversationId) return;
    const id = conversationId;
    async function run() {
      const items = await listConversationNotes(id);
      setNotes(items);
    }
    void run();
  }, [conversationId]);

  async function handleAdd() {
    if (!conversationId || !newText.trim() || busy) return;
    setBusy(true);
    const result = await createConversationNote(conversationId, newText.trim());
    setBusy(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Đã thêm ghi chú");
    setNewText("");
    void loadNotes(conversationId);
  }

  function startEdit(note: ConversationNoteItem) {
    setEditingId(note.id);
    setEditingText(note.text);
  }

  async function handleSaveEdit() {
    if (!conversationId || !editingId || busy) return;
    const text = editingText.trim();
    if (!text) {
      setEditingId(null);
      return;
    }
    setBusy(true);
    const result = await updateConversationNote(conversationId, editingId, { text });
    setBusy(false);
    setEditingId(null);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Đã cập nhật ghi chú");
    void loadNotes(conversationId);
  }

  async function handleDelete(noteId: string) {
    if (!conversationId || busy) return;
    setBusy(true);
    const result = await deleteConversationNote(conversationId, noteId);
    setBusy(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Đã xoá ghi chú");
    void loadNotes(conversationId);
  }

  async function handleTogglePin(note: ConversationNoteItem) {
    if (!conversationId || busy) return;
    setBusy(true);
    const nextPinned = !note.pinned;
    const result = await updateConversationNote(conversationId, note.id, { pinned: nextPinned });
    setBusy(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(nextPinned ? "Đã ghim ghi chú" : "Đã bỏ ghim ghi chú");
    void loadNotes(conversationId);
  }

  if (!hasActiveConversation) {
    return (
      <div
        className={cn(
          "flex w-full md:w-[27%] shrink-0 items-center justify-center border-l border-slate-200 bg-white h-full",
          className
        )}
      >
        <p className="text-sm text-slate-400">Chưa có thông tin khách hàng</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex w-full md:w-[27%] shrink-0 flex-col border-l border-slate-200 bg-white h-full",
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-slate-200 px-3">
        <div className="flex flex-1">
          <button
            type="button"
            onClick={() => setTab("info")}
            className={cn(
              "flex-1 border-b-2 py-3 text-sm font-semibold transition-colors cursor-pointer",
              tab === "info" ? "border-primary text-primary" : "border-transparent text-slate-400 hover:text-slate-600"
            )}
          >
            Thông tin
          </button>
          <button
            type="button"
            onClick={() => setTab("order")}
            className={cn(
              "flex-1 border-b-2 py-3 text-sm font-semibold transition-colors cursor-pointer",
              tab === "order" ? "border-primary text-primary" : "border-transparent text-slate-400 hover:text-slate-600"
            )}
          >
            Tạo đơn
          </button>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="ml-2 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 cursor-pointer xl:hidden"
          >
            <BsX className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="rounded-xl bg-slate-50 p-3">
          {/* Chiều cao CỐ ĐỊNH riêng cho danh sách ghi chú (khác ô nhập bên
              dưới, luôn hiện cố định) — nhiều ghi chú thì tự cuộn trong đúng
              khung này, không đẩy cả panel dài ra. */}
          <div className="h-45 overflow-y-auto">
            {!notes || notes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-3 text-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/note.png"
                  alt="Chưa có ghi chú"
                  className="h-24 w-auto object-contain"
                />
                <p className="mt-2 text-xs font-medium text-slate-500">Bạn chưa có ghi chú nào</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {notes.map((note) => (
                  <div key={note.id} className="group rounded-lg bg-white p-2 shadow-sm">
                    <div className="flex items-center gap-1.5">
                      {note.authorAvatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={note.authorAvatarUrl}
                          alt={note.authorName}
                          className="h-5 w-5 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-300 text-[9px] font-bold text-white">
                          {note.authorName.charAt(0).toUpperCase()}
                        </span>
                      )}
                      <span className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-800">
                        {note.authorName}
                      </span>
                      {/* Sửa/xoá: ẩn mặc định, chỉ hiện khi hover cả dòng
                          ghi chú (group-hover) — đỡ rối mắt. */}
                      <button
                        type="button"
                        onClick={() => startEdit(note)}
                        aria-label="Sửa ghi chú"
                        className="shrink-0 text-slate-400 opacity-0 transition-opacity hover:text-slate-600 cursor-pointer group-hover:opacity-100"
                      >
                        <BsPencilFill className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(note.id)}
                        aria-label="Xoá ghi chú"
                        className="shrink-0 text-slate-400 opacity-0 transition-opacity hover:text-red-500 cursor-pointer group-hover:opacity-100"
                      >
                        <BsTrashFill className="h-3 w-3" />
                      </button>
                      {/* Ghim: đã ghim thì LUÔN hiện (biết ngay không cần
                          hover) — chưa ghim thì ẩn như sửa/xoá, hover mới
                          hiện để ghim. */}
                      <button
                        type="button"
                        onClick={() => handleTogglePin(note)}
                        aria-label={note.pinned ? "Bỏ ghim" : "Ghim ghi chú"}
                        className={cn(
                          "shrink-0 transition-opacity cursor-pointer",
                          note.pinned
                            ? "text-primary opacity-100"
                            : "text-slate-400 opacity-0 hover:text-slate-600 group-hover:opacity-100"
                        )}
                      >
                        <BsPinFill className="h-3 w-3" />
                      </button>
                      <span className="shrink-0 text-[11px] text-slate-400">
                        {formatTimeLabel(note.createdAt)}
                      </span>
                    </div>

                    {editingId === note.id ? (
                      <textarea
                        autoFocus
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        onBlur={handleSaveEdit}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSaveEdit();
                          } else if (e.key === "Escape") {
                            setEditingId(null);
                          }
                        }}
                        rows={2}
                        className="mt-1 w-full resize-none rounded-md border border-slate-200 p-1 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    ) : (
                      <p className="mt-1 whitespace-pre-wrap break-words text-xs text-slate-700">
                        {note.text}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <textarea
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleAdd();
              }
            }}
            placeholder="Nhập ghi chú (Enter để gửi)"
            rows={2}
            className="mt-2 w-full resize-none rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <h3 className="mt-6 text-sm font-semibold text-slate-700">Đơn hàng</h3>

        <div className="mt-3 flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-200 py-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/empty-order.svg"
            alt="Chưa có lịch sử đơn hàng"
            className="h-24 w-auto object-contain"
          />
          <p className="text-xs text-slate-400 font-medium">Chưa có lịch sử đơn hàng</p>
          <button
            type="button"
            onClick={() => setTab("order")}
            className="mt-1 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
          >
            <BsPlusLg className="mr-1.5 h-3.5 w-3.5 text-slate-500" />
            Tạo đơn
          </button>
        </div>
      </div>
    </div>
  );
}
