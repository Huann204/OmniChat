"use client";

import * as React from "react";
import { BsCheckLg, BsChatDotsFill, BsX } from "react-icons/bs";
import { Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { toast } from "@/store/toast-store";
import {
  acceptZaloFriendRequest,
  listZaloFriendRequests,
  listZaloSentFriendRequests,
  openZaloConversation,
  rejectZaloFriendRequest,
  undoZaloFriendRequest,
  type ZaloFriendItem,
} from "@/app/actions/zaloFriend";
import { ZaloPageSelect, type ZaloPageOption } from "./ZaloPageSelect";

type Tab = "received" | "sent";

export function ZaloFriendRequestsModal({
  open,
  onClose,
  zaloPages,
  onOpenConversation,
}: {
  open: boolean;
  onClose: () => void;
  zaloPages: ZaloPageOption[];
  onOpenConversation?: (
    conversationId: string,
    preview: { name: string; avatarUrl?: string; pageId: string }
  ) => void;
}) {
  const [pageId, setPageId] = React.useState(zaloPages[0]?.id ?? "");
  const [tab, setTab] = React.useState<Tab>("received");
  const [received, setReceived] = React.useState<ZaloFriendItem[] | null>(null);
  const [sent, setSent] = React.useState<ZaloFriendItem[] | null>(null);
  const [loading, setLoading] = React.useState(false);
  // userId đang xử lý (chấp nhận/từ chối/thu hồi/nhắn tin) — chỉ 1 tại 1
  // thời điểm, disable đúng dòng đó tránh bấm trùng.
  const [processingUserId, setProcessingUserId] = React.useState<string | null>(null);

  // Tải CẢ 2 danh sách cùng lúc (không đợi bấm tab) — để hiện đúng số lượng
  // ngay trên nhãn tab ("Đã nhận (N)"/"Đã gửi (N)"), giống Zalo web.
  const loadAll = React.useCallback(async (targetPageId: string) => {
    if (!targetPageId) return;
    setLoading(true);
    const [receivedResult, sentResult] = await Promise.all([
      listZaloFriendRequests(targetPageId),
      listZaloSentFriendRequests(targetPageId),
    ]);
    setLoading(false);
    setReceived(receivedResult.items);
    setSent(sentResult.items);
    // Trước đây lỗi (mất phiên, lỗi mạng...) bị nuốt thành mảng rỗng, hiện y
    // hệt "0 lời mời" — giờ báo rõ ra để biết đâu mà debug (VD trên deploy
    // nhưng local không sao — rất có thể do lỗi ở đây chứ không phải do thật
    // sự không có lời mời nào).
    if (receivedResult.error) toast.error(`Đã nhận: ${receivedResult.error}`);
    if (sentResult.error) toast.error(`Đã gửi: ${sentResult.error}`);
  }, []);

  // Mở modal (hoặc đổi Page đang chọn) thì tự tải lại — set trong lúc render
  // (mirror MediaPickerModal.tsx) để tránh 1 vòng render thừa.
  const [prevKey, setPrevKey] = React.useState("");
  const key = `${open}:${zaloPages[0]?.id ?? ""}`;
  if (key !== prevKey) {
    setPrevKey(key);
    if (open) {
      const initialPageId = zaloPages[0]?.id ?? "";
      setPageId(initialPageId);
      setTab("received");
      setReceived(null);
      setSent(null);
      void loadAll(initialPageId);
    }
  }

  function handlePageChange(newPageId: string) {
    setPageId(newPageId);
    setReceived(null);
    setSent(null);
    void loadAll(newPageId);
  }

  async function handleAccept(user: ZaloFriendItem) {
    if (!pageId || processingUserId) return;
    setProcessingUserId(user.userId);
    const result = await acceptZaloFriendRequest(pageId, user.userId);
    setProcessingUserId(null);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(`Đã chấp nhận ${user.name}`);
    setReceived((prev) => prev?.filter((r) => r.userId !== user.userId) ?? prev);
  }

  async function handleReject(user: ZaloFriendItem) {
    if (!pageId || processingUserId) return;
    setProcessingUserId(user.userId);
    const result = await rejectZaloFriendRequest(pageId, user.userId);
    setProcessingUserId(null);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    setReceived((prev) => prev?.filter((r) => r.userId !== user.userId) ?? prev);
  }

  async function handleUndo(user: ZaloFriendItem) {
    if (!pageId || processingUserId) return;
    setProcessingUserId(user.userId);
    const result = await undoZaloFriendRequest(pageId, user.userId);
    setProcessingUserId(null);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    setSent((prev) => prev?.filter((r) => r.userId !== user.userId) ?? prev);
  }

  async function handleMessage(user: ZaloFriendItem) {
    if (!pageId || processingUserId) return;
    const selectedPage = zaloPages.find((p) => p.id === pageId);
    setProcessingUserId(user.userId);
    const result = await openZaloConversation(pageId, user.userId, user.name, user.avatarUrl);
    setProcessingUserId(null);
    if (result.error || !result.conversationId) {
      toast.error(result.error || "Không mở được hội thoại");
      return;
    }
    onOpenConversation?.(result.conversationId, {
      name: user.name,
      avatarUrl: user.avatarUrl,
      pageId: selectedPage?.externalPageId ?? "",
    });
    onClose();
  }

  const items = tab === "received" ? received : sent;

  return (
    <Modal open={open} onClose={onClose} title="Lời mời kết bạn">
      {/* Chiều cao CỐ ĐỊNH — mirror ZaloFriendListModal.tsx, tránh giật kích
          thước giữa lúc đang tải và lúc đã có danh sách. */}
      <div className="flex h-[70vh] flex-col overflow-hidden p-5">
        {zaloPages.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">
            Chưa kết nối Zalo nào — kết nối 1 tài khoản Zalo để dùng tính năng này.
          </p>
        ) : (
          <>
            {zaloPages.length > 1 && (
              <div className="mb-3 shrink-0">
                <ZaloPageSelect pages={zaloPages} value={pageId} onChange={handlePageChange} />
              </div>
            )}

            <div className="mb-3 flex shrink-0 border-b border-slate-200">
              <button
                type="button"
                onClick={() => setTab("received")}
                className={`px-3 pb-2.5 text-sm font-semibold transition-colors cursor-pointer ${
                  tab === "received"
                    ? "border-b-2 border-primary text-primary"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                Đã nhận ({received?.length ?? 0})
              </button>
              <button
                type="button"
                onClick={() => setTab("sent")}
                className={`px-3 pb-2.5 text-sm font-semibold transition-colors cursor-pointer ${
                  tab === "sent"
                    ? "border-b-2 border-primary text-primary"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                Đã gửi ({sent?.length ?? 0})
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {loading && <p className="py-6 text-center text-sm text-slate-400">Đang tải...</p>}
              {!loading && items && (
                <div className="divide-y divide-slate-100">
                  {items.map((r) => (
                    <div key={r.userId} className="flex items-center gap-3 py-2.5">
                      {r.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={r.avatarUrl}
                          alt={r.name}
                          className="h-9 w-9 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-300 text-xs font-bold text-white">
                          {r.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-slate-800">{r.name}</p>
                        {r.phone && <p className="text-xs text-slate-400">{r.phone}</p>}
                      </div>

                      {tab === "received" ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleReject(r)}
                            disabled={processingUserId !== null}
                            aria-label={`Từ chối ${r.name}`}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                          >
                            {processingUserId === r.userId ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <BsX className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAccept(r)}
                            disabled={processingUserId !== null}
                            aria-label={`Chấp nhận ${r.name}`}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                          >
                            {processingUserId === r.userId ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <BsCheckLg className="h-4 w-4" />
                            )}
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => handleMessage(r)}
                            disabled={processingUserId !== null}
                            aria-label={`Nhắn tin cho ${r.name}`}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                          >
                            <BsChatDotsFill className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUndo(r)}
                            disabled={processingUserId !== null}
                            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                          >
                            {processingUserId === r.userId ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              "Thu hồi"
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                  {items.length === 0 && (
                    <p className="py-6 text-center text-sm text-slate-400">
                      {tab === "received"
                        ? "Không có lời mời kết bạn nào đang chờ."
                        : "Chưa gửi lời mời kết bạn nào."}
                    </p>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
