"use client";

import * as React from "react";
import { io, type Socket } from "socket.io-client";
import { MessageSquareText } from "lucide-react";
import { DashboardNavbar } from "@/components/dashboard/DashboardNavbar";
import { getOlderMessages, markConversationRead, sendMessage } from "@/app/actions/conversation";
import { getSocketTicket } from "@/app/actions/socket";
import { formatClock, formatTimeLabel, messageKindAndContent } from "@/lib/message-format";
import { toast } from "@/store/toast-store";
import type { Bot } from "@/types/bot";
import type { Conversation, ConversationMessage } from "@/types/conversation";
import { InboxIconRail } from "./InboxIconRail";
import { ConversationList } from "./ConversationList";
import { ChatHeader } from "./ChatHeader";
import { MessageThread } from "./MessageThread";
import { QuickTagBar } from "./QuickTagBar";
import { MessageComposer } from "./MessageComposer";
import { CustomerInfoPanel } from "./CustomerInfoPanel";

const TABS = ["Hội thoại", "Đơn hàng", "Bài viết", "Thống kê", "Cài đặt"];

interface NewMessageEvent {
  conversationId: string;
  conversation: {
    id: string;
    pageId: string;
    customerName?: string;
    customerAvatarUrl?: string;
    lastMessage?: string;
    lastMessageAt: string;
    isRead: boolean;
  };
  message: {
    id: string;
    sender: "customer" | "page";
    text?: string;
    attachments?: { type: string; url: string }[];
    createdAt: string;
    // id tạm phía mình tự sinh lúc gửi — server echo lại nguyên văn (xem
    // NewMessageEvent trong realtime/socket.ts) để đối chiếu, biết đây là
    // tin CHÍNH MÌNH vừa gửi (đã hiện optimistic rồi) hay tin mới thật sự.
    clientId?: string;
  };
}

interface InboxViewProps {
  bot: Bot;
  userName: string;
  userEmail: string;
  initialConversations: Conversation[];
  // Danh sách Page thật cần join room realtime — mặc định chỉ [bot.id].
  // Truyền nhiều id khi đang xem gộp tạm thời nhiều Page cùng lúc.
  socketPageIds?: string[];
  // Tra cứu tên + avatar Page theo pageId — chỉ cần truyền khi xem gộp nhiều
  // Page, để hiện rõ mỗi hội thoại thuộc Page nào.
  pagesById?: Record<string, { name: string; avatarUrl?: string }>;
}

export function InboxView({
  bot,
  userName,
  userEmail,
  initialConversations,
  socketPageIds,
  pagesById,
}: InboxViewProps) {
  const [conversations, setConversations] = React.useState<Conversation[]>(initialConversations);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");
  const [activeTab, setActiveTab] = React.useState("Hội thoại");

  const activeConversation = conversations.find((c) => c.id === activeId) ?? null;
  const pageIds = socketPageIds ?? [bot.id];
  const pageIdsKey = pageIds.join(",");

  // Đọc được activeId mới nhất bên trong callback của socket mà không phải
  // đưa activeId vào dependency của effect kết nối socket (tránh disconnect
  // + reconnect mỗi lần user chọn hội thoại khác).
  const activeIdRef = React.useRef(activeId);
  React.useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  React.useEffect(() => {
    let socket: Socket | null = null;
    let cancelled = false;

    (async () => {
      const ticket = await getSocketTicket();
      if (!ticket || cancelled) return;

      socket = io(process.env.NEXT_PUBLIC_SOCKET_URL, { auth: { ticket } });

      socket.on("connect", () => {
        for (const id of pageIds) {
          socket?.emit("join_page", id);
        }
      });

      socket.on("new_message", (payload: NewMessageEvent) => {
        const { kind, text, attachmentUrl } = messageKindAndContent(
          payload.message.text,
          payload.message.attachments
        );
        const newMessage: ConversationMessage = {
          id: payload.message.id,
          sender: payload.message.sender,
          kind,
          text,
          attachmentUrl,
          time: formatClock(payload.message.createdAt),
          createdAt: payload.message.createdAt,
        };

        setConversations((prev) => {
          const index = prev.findIndex((c) => c.id === payload.conversationId);

          if (index === -1) {
            const newConversation: Conversation = {
              id: payload.conversation.id,
              pageId: payload.conversation.pageId,
              customerName: payload.conversation.customerName || "Khách hàng",
              customerAvatarUrl: payload.conversation.customerAvatarUrl,
              lastSeenLabel: "",
              timeLabel: formatTimeLabel(payload.conversation.lastMessageAt),
              isRead: false,
              hasMoreMessages: false,
              messages: [newMessage],
            };
            return [newConversation, ...prev];
          }

          const conversation = prev[index];
          // Echo của chính tin mình vừa gửi — đã hiện optimistic (và tự
          // chuyển "sent") ở handleSend rồi, bỏ qua không thêm trùng.
          if (
            payload.message.clientId &&
            conversation.messages.some((m) => m.id === payload.message.clientId)
          ) {
            return prev;
          }

          const isActive = payload.conversationId === activeIdRef.current;
          const updated = { ...conversation };
          updated.messages = [...updated.messages, newMessage];
          updated.timeLabel = formatTimeLabel(payload.conversation.lastMessageAt);
          updated.isRead = isActive;

          const rest = prev.filter((_, i) => i !== index);
          return [updated, ...rest];
        });

        if (payload.conversationId === activeIdRef.current) {
          void markConversationRead(payload.conversationId);
        }
      });
    })();

    return () => {
      cancelled = true;
      socket?.disconnect();
    };
    // Chỉ reconnect khi tập hợp id thực sự đổi (so theo pageIdsKey) — dùng
    // trực tiếp mảng pageIds bên trong effect để join, không đưa nó vào
    // dependency (mảng luôn là instance mới mỗi render).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageIdsKey]);

  function handleSelect(id: string) {
    setActiveId(id);
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, isRead: true } : c)));
    void markConversationRead(id);
  }

  // Hiện ngay 1 tin "đang gửi" (optimistic) bằng clientId tự sinh — khi tin
  // thật dội về qua socket, handler ở trên sẽ nhận ra (khớp clientId) và bỏ
  // qua, không thêm trùng. Ở đây chỉ cần tự đổi trạng thái sending -> sent
  // /failed dựa theo kết quả gọi API.
  async function handleSend(text: string) {
    if (!activeConversation) return;
    const conversationId = activeConversation.id;
    const clientId = `temp-${crypto.randomUUID()}`;
    const now = new Date().toISOString();

    const optimisticMessage: ConversationMessage = {
      id: clientId,
      sender: "page",
      kind: "text",
      text,
      time: formatClock(now),
      createdAt: now,
      status: "sending",
    };

    setConversations((prev) => {
      const index = prev.findIndex((c) => c.id === conversationId);
      if (index === -1) return prev;
      const updated = { ...prev[index], messages: [...prev[index].messages, optimisticMessage] };
      const rest = prev.filter((_, i) => i !== index);
      return [updated, ...rest];
    });

    const { error } = await sendMessage(conversationId, text, clientId);

    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversationId
          ? {
              ...c,
              messages: c.messages.map((m) =>
                m.id === clientId ? { ...m, status: error ? "failed" : "sent" } : m
              ),
            }
          : c
      )
    );

    if (error) toast.error(error);
  }

  // Tải thêm tin nhắn cũ hơn khi cuộn lên đầu khung chat — cursor lấy từ
  // tin nhắn cũ nhất ĐANG có ở client (đầu mảng messages).
  async function handleLoadMoreMessages(conversationId: string) {
    const conversation = conversations.find((c) => c.id === conversationId);
    if (!conversation || conversation.messages.length === 0) return;

    const oldest = conversation.messages[0];
    const { messages: olderMessages, hasMore } = await getOlderMessages(
      conversationId,
      oldest.createdAt,
      oldest.id
    );

    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversationId
          ? { ...c, messages: [...olderMessages, ...c.messages], hasMoreMessages: hasMore }
          : c
      )
    );
  }

  return (
    <div className="flex h-screen flex-col bg-[rgb(80,109,173)]">
      <DashboardNavbar
        userName={userName}
        userEmail={userEmail}
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        className="!bg-none bg-transparent border-none shadow-none"
      />

      <div className="flex min-h-0 flex-1">
        <InboxIconRail className="!bg-none bg-transparent border-none" />

        <div className="flex flex-1 min-w-0 bg-white rounded-tl-xl overflow-hidden">
          <ConversationList
            conversations={conversations}
            activeId={activeId}
            search={search}
            onSearchChange={setSearch}
            onSelect={handleSelect}
            pagesById={pagesById}
          />

          {activeConversation ? (
            <div className="flex min-w-0 flex-1 flex-col">
              <ChatHeader conversation={activeConversation} />
              <MessageThread
                messages={activeConversation.messages}
                customerName={activeConversation.customerName}
                customerAvatarUrl={activeConversation.customerAvatarUrl}
                hasMoreMessages={activeConversation.hasMoreMessages}
                onLoadMore={() => handleLoadMoreMessages(activeConversation.id)}
              />
              <QuickTagBar />
              <MessageComposer onSend={handleSend} />
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 text-slate-400">
              <MessageSquareText className="h-10 w-10" strokeWidth={1.5} />
              <p className="text-sm">Xin chọn 1 hội thoại từ danh sách bên trái</p>
            </div>
          )}

          <CustomerInfoPanel hasActiveConversation={!!activeConversation} />
        </div>
      </div>
    </div>
  );
}
