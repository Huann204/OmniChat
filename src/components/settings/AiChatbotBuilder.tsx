"use client";

import * as React from "react";
import {
  BsChevronDown,
  BsChevronRight,
  BsPencilFill,
  BsPlusLg,
  BsRobot,
  BsSendFill,
  BsStars,
  BsTrashFill,
} from "react-icons/bs";
import { cn } from "@/lib/utils";
import {
  createChatbotConfig,
  deleteChatbotConfig,
  previewChatbotReply,
  updateChatbotConfig,
} from "@/app/actions/chatbotConfig";
import { createKnowledgeEntry, deleteKnowledgeEntry, getKnowledgeEntries } from "@/app/actions/knowledgeEntry";
import { AssignChatbotPagesModal } from "@/components/settings/AssignChatbotPagesModal";
import { toast } from "@/store/toast-store";
import type { Bot } from "@/types/bot";
import type { ChatbotConfig } from "@/types/chatbotConfig";
import type { KnowledgeEntry } from "@/types/knowledgeEntry";

// Đã nối API thật (ChatbotConfig — server/src/models/chatbotConfig.model.ts):
// tên/hướng dẫn/model tự lưu khi sửa (debounce 600ms, giống ô tìm kiếm ở
// InboxView.tsx), tạo/xoá bot gọi thẳng, không cần nút "Lưu" riêng. Kho kiến
// thức cũng đã nối thật, kèm embedding (Gemini) tự tính lúc thêm. Chat
// preview bên phải giờ gọi PIPELINE THẬT (previewChatbotReply — tìm kiến
// thức liên quan + ghép Hướng dẫn của bot làm system prompt, gọi Gemini sinh
// câu trả lời tự nhiên, xem chatbotConfig.controller.ts) — không còn chỉ
// hiện thô kết quả tìm kiếm. "Chọn Page" cũng đã nối thật (AssignChatbotPagesModal.tsx
// + ConnectedPage.chatbotId).
//
// Thiết kế NHIỀU bot (chọn qua dropdown ở header) — mỗi phần tử `bots` là 1
// document ChatbotConfig riêng, cho phép "mỗi Page dùng 1 chatbot khác
// nhau": ConnectedPage.chatbotId trỏ tới 1 bot trong danh sách này.

const DEFAULT_INSTRUCTIONS = `## Nhân vật
Bạn là 1 chuyên gia...

### Kỹ năng
- Bạn có kỹ năng 1
- Bạn có kỹ năng 2
- Bạn có kỹ năng 3

### Giới hạn
- Chỉ trả lời những câu hỏi liên quan đến...
- Giữ kết luận trong khoảng 100 từ
- Cung cấp thông tin chính xác và tin cậy
- Không đưa ra các lời khuyên ngoài phạm vi...`;

const MODEL_OPTIONS = ["Gemini 2.5 Flash", "Gemini 2.5 Pro"];

interface PreviewMessage {
  role: "bot" | "user";
  text: string;
}

function CollapsibleRow({
  title,
  open,
  onToggle,
  action,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  action?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="border-b border-slate-200 last:border-0">
      <div className="flex items-center gap-2 px-4 py-3">
        <button
          type="button"
          onClick={onToggle}
          className="flex min-w-0 flex-1 items-center gap-2 text-left text-sm cursor-pointer"
        >
          <BsChevronRight
            className={cn(
              "h-3 w-3 shrink-0 text-slate-400 transition-transform",
              open && "rotate-90"
            )}
          />
          <span className="font-semibold text-slate-900">{title}</span>
        </button>
        {action}
      </div>
      {open && <div className="px-4 pb-4 pl-9">{children}</div>}
    </div>
  );
}

interface AiChatbotBuilderProps {
  initialChatbots: ChatbotConfig[];
  pages: Bot[];
}

export function AiChatbotBuilder({ initialChatbots, pages: initialPages }: AiChatbotBuilderProps) {
  const [bots, setBots] = React.useState<ChatbotConfig[]>(initialChatbots);
  const [activeBotId, setActiveBotId] = React.useState<string | null>(initialChatbots[0]?.id ?? null);
  const [creatingDefault, setCreatingDefault] = React.useState(initialChatbots.length === 0);
  const [botPickerOpen, setBotPickerOpen] = React.useState(false);
  const [creatingNew, setCreatingNew] = React.useState(false);
  const [newBotName, setNewBotName] = React.useState("");
  const [renaming, setRenaming] = React.useState(false);
  const [renameDraft, setRenameDraft] = React.useState("");
  const [publishing, setPublishing] = React.useState(false);
  const [modelOpen, setModelOpen] = React.useState(true);
  const [knowledgeOpen, setKnowledgeOpen] = React.useState(false);
  const [knowledgeEntries, setKnowledgeEntries] = React.useState<KnowledgeEntry[]>([]);
  const [addingKnowledge, setAddingKnowledge] = React.useState(false);
  const [newKnowledgeContent, setNewKnowledgeContent] = React.useState("");
  const [previewInput, setPreviewInput] = React.useState("");
  const [previewMessages, setPreviewMessages] = React.useState<PreviewMessage[]>([]);
  const [previewLoading, setPreviewLoading] = React.useState(false);
  const [pages, setPages] = React.useState<Bot[]>(initialPages);
  const [pagesModalOpen, setPagesModalOpen] = React.useState(false);

  // Shop chưa từng tạo bot nào — tự tạo sẵn 1 bot mặc định ngay khi vào
  // trang, để mọi thao tác sau đó (sửa hướng dẫn, đổi model...) đều là
  // update vào 1 bot đã tồn tại thật, không cần phân biệt "bot nháp/bot
  // thật" ở khắp nơi trong component.
  React.useEffect(() => {
    if (!creatingDefault) return;
    let cancelled = false;
    void (async () => {
      const result = await createChatbotConfig({
        name: "Trợ lý mặc định",
        instructions: DEFAULT_INSTRUCTIONS,
        model: MODEL_OPTIONS[0],
      });
      if (cancelled) return;
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      setBots([result.item]);
      setActiveBotId(result.item.id);
      setCreatingDefault(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [creatingDefault]);

  const activeBot = bots.find((b) => b.id === activeBotId);
  const chatbotNameById = React.useMemo(
    () => Object.fromEntries(bots.map((b) => [b.id, b.name])),
    [bots]
  );
  const assignedPages = React.useMemo(
    () => (activeBot ? pages.filter((p) => p.chatbotId === activeBot.id) : []),
    [pages, activeBot]
  );

  function handlePagesAssigned(pageIds: string[]) {
    if (!activeBot) return;
    const pageIdSet = new Set(pageIds);
    setPages((prev) =>
      prev.map((p) => {
        if (pageIdSet.has(p.id)) return { ...p, chatbotId: activeBot.id };
        if (p.chatbotId === activeBot.id) return { ...p, chatbotId: undefined };
        return p;
      })
    );
  }

  // Tải lại danh sách kiến thức mỗi khi đổi bot đang chọn — mirror cách
  // MessageComposer.tsx tải danh sách thành viên nhóm lúc mở hội thoại (hàm
  // fetch khai báo NGAY TRONG effect, không qua useCallback ngoài, để ESLint
  // rule react-hooks/set-state-in-effect không coi nhầm là setState đồng bộ).
  React.useEffect(() => {
    if (!activeBotId) return;
    async function run() {
      const items = await getKnowledgeEntries(activeBotId!);
      setKnowledgeEntries(items);
    }
    void run();
  }, [activeBotId]);

  const saveTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce lưu — chỉ gọi API sau khi ngừng gõ 600ms, tránh bắn 1 request
  // mỗi ký tự khi đang sửa hướng dẫn.
  function scheduleSave(botId: string, patch: { name?: string; instructions?: string; model?: string }) {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      void updateChatbotConfig(botId, patch).then((result) => {
        if ("error" in result) toast.error(result.error);
      });
    }, 600);
  }

  function updateActiveBot(patch: Partial<Omit<ChatbotConfig, "id">>) {
    if (!activeBot) return;
    setBots((prev) => prev.map((b) => (b.id === activeBot.id ? { ...b, ...patch } : b)));
    scheduleSave(activeBot.id, patch);
  }

  async function handleTogglePublish() {
    if (!activeBot || publishing) return;
    const nextEnabled = !activeBot.autoReplyEnabled;
    if (nextEnabled && assignedPages.length === 0) {
      toast.error("Chưa gán Page nào cho bot này — chọn Page trước khi xuất bản");
      return;
    }
    setPublishing(true);
    const result = await updateChatbotConfig(activeBot.id, { autoReplyEnabled: nextEnabled });
    setPublishing(false);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    setBots((prev) => prev.map((b) => (b.id === activeBot.id ? result.item : b)));
    toast.success(nextEnabled ? "Đã xuất bản — bot bắt đầu tự động trả lời" : "Đã gỡ xuất bản");
  }

  function startCreateBot() {
    setNewBotName("");
    setCreatingNew(true);
  }

  async function confirmCreateBot() {
    const name = newBotName.trim();
    if (!name) return;
    const result = await createChatbotConfig({
      name,
      instructions: DEFAULT_INSTRUCTIONS,
      model: MODEL_OPTIONS[0],
    });
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    setBots((prev) => [...prev, result.item]);
    setActiveBotId(result.item.id);
    setCreatingNew(false);
    setBotPickerOpen(false);
    setPreviewMessages([]);
  }

  async function handleDeleteBot(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (bots.length <= 1) {
      toast.error("Phải giữ lại ít nhất 1 chatbot");
      return;
    }
    const result = await deleteChatbotConfig(id);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    const next = bots.filter((b) => b.id !== id);
    setBots(next);
    if (activeBotId === id) setActiveBotId(next[0].id);
  }

  function handleSelectBot(id: string) {
    setActiveBotId(id);
    setBotPickerOpen(false);
    setPreviewMessages([]);
    setAddingKnowledge(false);
  }

  function openAddKnowledge() {
    setKnowledgeOpen(true);
    setAddingKnowledge(true);
    setNewKnowledgeContent("");
  }

  async function confirmAddKnowledge() {
    if (!activeBot) return;
    const content = newKnowledgeContent.trim();
    if (!content) return;
    const result = await createKnowledgeEntry(activeBot.id, content);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    setKnowledgeEntries((prev) => [...prev, result.item]);
    setAddingKnowledge(false);
    setNewKnowledgeContent("");
  }

  async function handleDeleteKnowledge(id: string) {
    const result = await deleteKnowledgeEntry(id);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    setKnowledgeEntries((prev) => prev.filter((k) => k.id !== id));
  }

  function startRename() {
    if (!activeBot) return;
    setRenameDraft(activeBot.name);
    setRenaming(true);
    setBotPickerOpen(false);
  }

  function commitRename() {
    setRenaming(false);
    const name = renameDraft.trim();
    if (!name || !activeBot || name === activeBot.name) return;
    updateActiveBot({ name });
  }

  function handleNewChat() {
    setPreviewMessages([]);
    setPreviewInput("");
  }

  async function handlePreviewSend() {
    const text = previewInput.trim();
    if (!activeBot || !text || previewLoading) return;
    // Lấy lịch sử TRƯỚC KHI thêm tin nhắn mới vào state — gửi kèm cho server
    // để tìm kiến thức/trả lời đúng ngữ cảnh (VD trả lời cộc lốc "Hà nội đi"
    // chỉ có nghĩa khi biết bot vừa hỏi lại điều gì), xem chatbotConfig.controller.ts.
    const history = previewMessages;
    setPreviewMessages((prev) => [...prev, { role: "user", text }]);
    setPreviewInput("");

    setPreviewLoading(true);
    const result = await previewChatbotReply(activeBot.id, text, history);
    setPreviewLoading(false);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    setPreviewMessages((prev) => [...prev, { role: "bot", text: result.reply }]);
  }

  if (!activeBot) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-slate-400">
        Đang tạo chatbot mặc định...
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="relative min-w-0">
          {renaming ? (
            <input
              autoFocus
              value={renameDraft}
              onChange={(e) => setRenameDraft(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
                if (e.key === "Escape") setRenaming(false);
              }}
              className="rounded-lg border border-slate-300 px-2 py-1 text-base font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          ) : (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setBotPickerOpen((v) => !v)}
                className="flex items-center gap-1.5 rounded-lg px-1.5 py-1 text-left transition-colors hover:bg-slate-100 cursor-pointer"
              >
                <h2 className="truncate text-base font-semibold text-slate-900">{activeBot.name}</h2>
                <BsChevronDown
                  className={cn(
                    "h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform",
                    botPickerOpen && "rotate-180"
                  )}
                />
              </button>
              <button
                type="button"
                onClick={startRename}
                aria-label="Đổi tên chatbot"
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-slate-300 transition-colors hover:bg-slate-100 hover:text-slate-500 cursor-pointer"
              >
                <BsPencilFill className="h-3 w-3" />
              </button>
            </div>
          )}
          <p className="px-1.5 text-xs text-slate-400">
            Áp dụng cho Page:{" "}
            <button
              type="button"
              onClick={() => setPagesModalOpen(true)}
              className={cn(
                "cursor-pointer hover:underline",
                assignedPages.length === 0 ? "italic text-slate-400" : "font-medium text-primary"
              )}
            >
              {assignedPages.length === 0
                ? "chưa gán — bấm để chọn"
                : assignedPages.map((p) => p.name).join(", ")}
            </button>
          </p>

          {botPickerOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => {
                  setBotPickerOpen(false);
                  setCreatingNew(false);
                }}
              />
              <div className="absolute left-0 top-full z-20 mt-1 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                {bots.map((bot) => (
                  <div
                    key={bot.id}
                    className={cn(
                      "group flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-slate-50",
                      bot.id === activeBot.id && "bg-primary/5 font-semibold text-primary"
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => handleSelectBot(bot.id)}
                      className="flex min-w-0 flex-1 items-center gap-2 cursor-pointer"
                    >
                      <BsRobot className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span className="truncate">{bot.name}</span>
                    </button>
                    {bots.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => handleDeleteBot(bot.id, e)}
                        aria-label={`Xoá ${bot.name}`}
                        className="shrink-0 cursor-pointer rounded-full p-1 text-slate-300 opacity-0 transition-colors group-hover:opacity-100 hover:bg-red-50 hover:text-red-500"
                      >
                        <BsTrashFill className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))}
                <div className="my-1 border-t border-slate-100" />
                {creatingNew ? (
                  <div className="flex items-center gap-1.5 px-3 py-2">
                    <input
                      autoFocus
                      value={newBotName}
                      onChange={(e) => setNewBotName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") void confirmCreateBot();
                        if (e.key === "Escape") setCreatingNew(false);
                      }}
                      placeholder="Tên chatbot..."
                      className="min-w-0 flex-1 rounded-lg border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                    <button
                      type="button"
                      onClick={() => void confirmCreateBot()}
                      disabled={!newBotName.trim()}
                      aria-label="Xác nhận tạo chatbot"
                      className="shrink-0 cursor-pointer rounded-full p-1.5 text-primary transition-colors hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <BsPlusLg className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={startCreateBot}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-primary transition-colors hover:bg-slate-50 cursor-pointer"
                  >
                    <BsPlusLg className="h-3.5 w-3.5 shrink-0" />
                    Tạo chatbot mới
                  </button>
                )}
              </div>
            </>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={handleNewChat}
            className="rounded-full border border-slate-200 px-3.5 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 cursor-pointer"
          >
            Chat mới
          </button>
          <button
            type="button"
            onClick={() => void handleTogglePublish()}
            disabled={publishing}
            title={
              activeBot.autoReplyEnabled
                ? "Bot đang tự động trả lời thật cho các Page đã gán — bấm để tắt"
                : assignedPages.length === 0
                  ? "Chọn Page trước khi xuất bản"
                  : "Bật tự động trả lời thật cho các Page đã gán"
            }
            className={cn(
              "rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50",
              activeBot.autoReplyEnabled
                ? "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                : "bg-primary text-white hover:bg-primary-hover"
            )}
          >
            {activeBot.autoReplyEnabled ? "Đang hoạt động — Gỡ xuất bản" : "Xuất bản"}
          </button>
        </div>
      </div>

      <div className="w-full overflow-x-auto rounded-2xl">
        <div className="flex h-[calc(100vh-260px)] min-h-[520px] min-w-[640px] overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm">
          {/* Hướng dẫn */}
          <div className="flex w-[36%] min-w-[220px] lg:min-w-[250px] flex-col border-r border-slate-200">
            <div className="flex items-center gap-4 border-b border-slate-200 px-4 py-3">
              <span className="text-sm font-semibold text-slate-900">Hướng dẫn</span>
              <div className="ml-auto flex items-center gap-3 text-xs">
                <button type="button" className="text-slate-400 transition-colors hover:text-slate-600 cursor-pointer">
                  Xem mẫu
                </button>
                <button type="button" className="text-slate-400 transition-colors hover:text-slate-600 cursor-pointer">
                  AI rules
                </button>
                <button
                  type="button"
                  className="flex items-center gap-1 font-medium text-primary transition-colors hover:text-primary-hover cursor-pointer"
                >
                  <BsStars className="h-3.5 w-3.5" />
                  Viết lại
                </button>
              </div>
            </div>
            <textarea
              value={activeBot.instructions}
              onChange={(e) => updateActiveBot({ instructions: e.target.value })}
              spellCheck={false}
              className="flex-1 resize-none border-none bg-transparent p-4 text-sm leading-relaxed text-slate-700 focus:outline-none"
            />
          </div>

          {/* Model + Kiến thức */}
          <div className="flex w-[32%] min-w-[200px] lg:min-w-[230px] flex-col border-r border-slate-200 bg-slate-50/50">
            <CollapsibleRow title="Model" open={modelOpen} onToggle={() => setModelOpen((v) => !v)}>
              <select
                value={activeBot.model}
                onChange={(e) => updateActiveBot({ model: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                {MODEL_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </CollapsibleRow>

            <CollapsibleRow
              title="Kiến thức"
              open={knowledgeOpen}
              onToggle={() => setKnowledgeOpen((v) => !v)}
              action={
                <button
                  type="button"
                  onClick={openAddKnowledge}
                  aria-label="Thêm kiến thức"
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600 cursor-pointer"
                >
                  <BsPlusLg className="h-3.5 w-3.5" />
                </button>
              }
            >
              <div className="space-y-2">
                {addingKnowledge && (
                  <div className="rounded-lg border border-slate-200 bg-white p-2">
                    <textarea
                      autoFocus
                      value={newKnowledgeContent}
                      onChange={(e) => setNewKnowledgeContent(e.target.value)}
                      rows={3}
                      placeholder="Nhập nội dung kiến thức..."
                      className="w-full resize-none border-none text-sm text-slate-700 focus:outline-none"
                    />
                    <div className="mt-1.5 flex justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setAddingKnowledge(false)}
                        className="rounded-full px-2.5 py-1 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 cursor-pointer"
                      >
                        Huỷ
                      </button>
                      <button
                        type="button"
                        onClick={() => void confirmAddKnowledge()}
                        disabled={!newKnowledgeContent.trim()}
                        className="cursor-pointer rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Thêm
                      </button>
                    </div>
                  </div>
                )}

                {knowledgeEntries.length === 0 && !addingKnowledge ? (
                  <p className="text-sm text-slate-400">Chưa có mục kiến thức nào.</p>
                ) : (
                  knowledgeEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="group flex items-start gap-2 rounded-lg border border-slate-200 bg-white p-2"
                    >
                      <p className="line-clamp-3 min-w-0 flex-1 whitespace-pre-wrap text-sm text-slate-700">
                        {entry.content}
                      </p>
                      <button
                        type="button"
                        onClick={() => void handleDeleteKnowledge(entry.id)}
                        aria-label="Xoá mục kiến thức"
                        className="shrink-0 cursor-pointer rounded-full p-1 text-slate-300 opacity-0 transition-colors group-hover:opacity-100 hover:bg-red-50 hover:text-red-500"
                      >
                        <BsTrashFill className="h-3 w-3" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </CollapsibleRow>
          </div>

          {/* Chat preview */}
          <div className="flex flex-1 min-w-[220px] flex-col bg-slate-50/30">
            <div className="flex-1 overflow-y-auto p-4">
              {previewMessages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-1.5 text-center">
                  <span className="mb-1 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-sky-400 text-2xl text-white">
                    <BsRobot />
                  </span>
                  <p className="text-sm font-semibold text-slate-800">{activeBot.name}</p>
                  <p className="text-xs text-slate-400">Tư vấn khách hàng</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {previewMessages.map((m, i) => (
                    <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                      <div
                        className={cn(
                          "max-w-[75%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm shadow-sm",
                          m.role === "user"
                            ? "bg-primary text-white"
                            : "border border-slate-200 bg-white text-slate-700"
                        )}
                      >
                        {m.text}
                      </div>
                    </div>
                  ))}
                  {previewLoading && (
                    <div className="flex justify-start">
                      <div className="rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-400 shadow-sm">
                        Đang soạn câu trả lời...
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 border-t border-slate-200 p-3">
              <input
                value={previewInput}
                onChange={(e) => setPreviewInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void handlePreviewSend();
                }}
                disabled={previewLoading}
                placeholder="Gửi tin nhắn"
                className="flex-1 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-60"
              />
              <button
                type="button"
                onClick={() => void handlePreviewSend()}
                disabled={previewLoading}
                aria-label="Gửi"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-primary transition-colors hover:bg-primary/10 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
              >
                <BsSendFill className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <AssignChatbotPagesModal
        open={pagesModalOpen}
        onClose={() => setPagesModalOpen(false)}
        chatbotId={activeBot.id}
        chatbotName={activeBot.name}
        pages={pages}
        chatbotNameById={chatbotNameById}
        onAssigned={handlePagesAssigned}
      />
    </div>
  );
}
